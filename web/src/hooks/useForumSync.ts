import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useForumStore } from "@/store/useForumStore";
import { getWsUrl } from "@/lib/wsUrl";

const WS_URL = getWsUrl();

export function useForumSync(
  subjectId: string | null,
  questionId: string | null
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let reconnectAttempts = 0;
    const maxAttempts = 5;

    const connect = () => {
      const raw = localStorage.getItem("uniconnect-auth-session");
      const token = raw ? (JSON.parse(raw)?.state?.accessToken ?? null) : null;
      if (!token) return;

      const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
        console.log("[useForumSync] WebSocket connected");

        if (subjectId) {
          console.log(`[useForumSync] Subscribing to subject: ${subjectId}`);
          ws.send(JSON.stringify({ type: "subscribe", subjectId }));
        }

        if (questionId) {
          console.log(`[useForumSync] Subscribing to question: ${questionId}`);
          ws.send(JSON.stringify({ type: "subscribe", questionId }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const store = useForumStore.getState();

          console.log("[useForumSync] Received WS message:", data.event, data.payload);

          switch (data.event) {
            case "new_question": {
              store.addQuestion(data.payload);
              break;
            }
            case "new_answer": {
              store.addAnswer(data.payload);
              break;
            }
            case "question_solved": {
              if (store.activeQuestion && store.activeQuestion.id === data.payload.id) {
                store.updateQuestion(data.payload);
              }
              break;
            }
            case "answer_pin_changed": {
              if (questionId) {
                store.loadQuestionDetail(questionId).catch(() => {});
              }
              break;
            }
            case "question_vote_updated": {
              if (store.activeQuestion && store.activeQuestion.id === data.payload.targetId) {
                store.updateQuestion({
                  ...store.activeQuestion,
                  voteCount: data.payload.voteCount,
                });
              } else {
                const subject = subjectId || store.activeQuestion?.subjectId;
                if (subject) {
                  const list = store.questionsBySubject[subject] || [];
                  const found = list.find((q) => q.id === data.payload.targetId);
                  if (found) {
                    store.updateQuestion({
                      ...found,
                      voteCount: data.payload.voteCount,
                    });
                  }
                }
              }
              break;
            }
            case "answer_vote_updated": {
              const answers = store.answers;
              const foundAnswer = answers.find((a) => a.id === data.payload.targetId);
              if (foundAnswer) {
                store.updateAnswer({
                  ...foundAnswer,
                  voteCount: data.payload.voteCount,
                });
              }
              break;
            }
            default:
              break;
          }
        } catch (e) {
          console.error("[useForumSync] Error processing WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (reconnectAttempts < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectAttempts++;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Send unsubscribe messages if still open
        if (wsRef.current.readyState === WebSocket.OPEN) {
          if (subjectId) {
            wsRef.current.send(JSON.stringify({ type: "unsubscribe", subjectId }));
          }
          if (questionId) {
            wsRef.current.send(JSON.stringify({ type: "unsubscribe", questionId }));
          }
        }
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, subjectId, questionId]);
}
export default useForumSync;

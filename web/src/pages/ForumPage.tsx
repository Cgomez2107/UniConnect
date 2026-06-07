import { useState, useEffect, useCallback } from "react";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { deps } from "@/store/deps";
import { QuestionCard } from "@/components/forum/QuestionCard";
import { AskQuestionModal } from "@/components/forum/AskQuestionModal";
import { forumService } from "@/lib/forum/forum.service";
import { useForumStore } from "@/store/useForumStore";
import { useForumSync } from "@/hooks";

interface SubjectInfo {
  id: string;
  name: string;
}

export function ForumPage() {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(null);
  const [askModalOpen, setAskModalOpen] = useState(false);

  // Subscribe to real-time events for the selected subject
  useForumSync(selectedSubject?.id || null, null);

  // Pull questions from global store
  const questionsBySubject = useForumStore((s) => s.questionsBySubject);
  const questionsLoading = useForumStore((s) => s.isLoading);
  const loadQuestions = useForumStore((s) => s.loadQuestions);

  const loadSubjects = useCallback(async () => {
    try {
      const mySubjects = await deps.apiClients.profiles.getMySubjects();
      const mapped = mySubjects.map((s) => ({ id: s.subjectId, name: s.subject.name }));
      setSubjects(mapped);

      // Load questions for each subject into the global store
      await Promise.all(
        mapped.map(async (sub) => {
          try {
            await loadQuestions(sub.id, 1, 5);
          } catch (err) {
            console.error(`[ForumPage] Error loading questions for subject ${sub.id}:`, err);
          }
        })
      );
    } catch (err) {
      console.error("[ForumPage] Error loading subjects:", err);
    } finally {
      setSubjectsLoading(false);
    }
  }, [loadQuestions]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const handleCreateQuestion = async (title: string, body: string) => {
    if (!selectedSubject) return;
    const newQuestion = await forumService.createQuestion({
      subjectId: selectedSubject.id,
      title,
      body,
    });
    // Optimistically inject into the store so the list updates immediately
    // even before Supabase Realtime fires the INSERT event
    useForumStore.getState().addQuestion(newQuestion as any);
  };

  const loading = subjectsLoading;

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            {selectedSubject ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">
                    {selectedSubject.name}
                  </h1>
                  <p className="text-neutral-500 text-sm">Foro de la asignatura</p>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-neutral-900">Foro</h1>
                <p className="text-neutral-500 text-sm">
                  Preguntas y respuestas por asignatura
                </p>
              </>
            )}
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-lg" />
            ))}
          </div>
        )}

        {!loading && !selectedSubject && (
          <div className="grid gap-4">
            {subjects.length === 0 && (
              <div className="text-center py-16">
                <MessageSquare size={48} className="mx-auto text-neutral-300 mb-4" />
                <p className="text-neutral-500">
                  No tienes asignaturas matriculadas.
                </p>
              </div>
            )}
            {subjects.map((subject) => {
              const qs = questionsBySubject[subject.id] || [];
              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject)}
                  className="w-full text-left bg-white rounded-lg border border-neutral-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {subject.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        {qs.length} pregunta{qs.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-xs text-primary-600 font-medium">
                      Ver foro
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && selectedSubject && (
          <div className="space-y-4">
            <button
              onClick={() => setAskModalOpen(true)}
              className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Nueva pregunta
            </button>

            {questionsLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 skeleton rounded-lg" />
                ))}
              </div>
            )}

            {!questionsLoading &&
              (questionsBySubject[selectedSubject.id] || []).length === 0 && (
                <div className="text-center py-16">
                  <MessageSquare size={48} className="mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-500 mb-2">
                    No hay preguntas aún en esta asignatura.
                  </p>
                  <p className="text-sm text-neutral-400">
                    Sé el primero en preguntar.
                  </p>
                </div>
              )}

            <div className="space-y-3">
              {(questionsBySubject[selectedSubject.id] || []).map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedSubject && (
        <AskQuestionModal
          isOpen={askModalOpen}
          onClose={() => setAskModalOpen(false)}
          onSubmit={handleCreateQuestion}
          subjectName={selectedSubject.name}
        />
      )}
    </div>
  );
}

export default ForumPage;

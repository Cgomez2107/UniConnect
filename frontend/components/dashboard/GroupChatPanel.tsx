import React, { useState } from "react";

import type { GroupMessage } from "@/types/adminDashboard";
import { transformRawMessage } from "@/chat/utils/messageFactory";

interface Props {
  groupName: string;
  onlineCount: number;
  messages: GroupMessage[];
  currentUserId: string;
  onSendMessage?: (content: string) => Promise<void> | void;
  isSending?: boolean;
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

export function GroupChatPanel({
  groupName,
  onlineCount,
  messages,
  currentUserId,
  onSendMessage,
  isSending = false,
}: Props) {
  const [draft, setDraft] = useState("");

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !onSendMessage || isSending) return;
    setDraft("");
    await onSendMessage(trimmed);
  };
  return (
    <section className="col-span-12 lg:col-span-8 flex flex-col bg-[#1A1C1E] border border-[#2D3135] rounded-xl overflow-hidden shadow-2xl">
      <header className="p-4 bg-[#26292B] border-b border-[#2D3135] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div>
            <h3 className="font-h3 text-body-md text-white font-bold leading-tight">
              Chat Grupal: {groupName}
            </h3>
            <p className="text-[10px] text-zinc-500">{onlineCount} miembros en linea</p>
          </div>
        </div>
        <button className="text-zinc-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUserId;
          const time = formatTime(message.createdAt);
          const senderLabel = message.senderFullName ?? "Usuario";

          return (
            <div
              key={message.id}
              className={
                isCurrentUser
                  ? "flex flex-col items-end self-end max-w-[80%]"
                  : "flex flex-col items-start max-w-[80%]"
              }
            >
              <div className="flex items-center gap-2 mb-1">
                {isCurrentUser ? (
                  <>
                    <span className="text-[9px] text-zinc-600">{time}</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      Tu
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {senderLabel}
                    </span>
                    <span className="text-[9px] text-zinc-600">{time}</span>
                  </>
                )}
              </div>
              <div
                className={
                  isCurrentUser
                    ? "bg-primary/10 text-primary px-4 py-3 rounded-2xl rounded-tr-none border border-primary/20 text-body-sm"
                    : "bg-[#26292B] text-zinc-300 px-4 py-3 rounded-2xl rounded-tl-none border border-[#2D3135] text-body-sm"
                }
              >
                {transformRawMessage(message).render({ currentUserId })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-[#1A1C1E] border-t border-[#2D3135]">
        <div className="relative flex items-center gap-3 bg-[#26292B] border border-[#2D3135] rounded-xl p-2 focus-within:border-primary transition-all">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <input
            className="bg-transparent border-none focus:ring-0 text-body-sm text-white flex-1 placeholder:text-zinc-600"
            placeholder="Escribe un mensaje..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            type="text"
            disabled={isSending}
          />
          <button
            className="bg-primary hover:bg-primary/90 text-on-primary font-bold p-2.5 rounded-lg transition-all flex items-center justify-center disabled:opacity-60"
            onClick={() => void handleSend()}
            disabled={isSending || draft.trim().length === 0}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              send
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

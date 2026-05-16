import React, { useState, useRef, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface MemberLike {
  userId: string;
  user?: { firstName?: string; lastName?: string; fullName?: string } | null;
  fullName?: string;
  role?: string;
}

function getMemberName(m: MemberLike): string {
  if (m.user?.firstName) return `${m.user.firstName} ${m.user.lastName || ""}`.trim();
  if (m.user?.fullName) return m.user.fullName;
  if (m.fullName) return m.fullName;
  return "Usuario";
}

interface MentionInputProps {
  members: MemberLike[];
  currentUserId: string;
  onSend: (content: string, mentions: { userId: string; name: string }[]) => void;
  onSendImage?: (file: File) => void;
  uploadingImage?: boolean;
  sending?: boolean;
  placeholder?: string;
  disabled?: boolean;
  replyingTo?: { content: string } | null;
  onCancelReply?: () => void;
}

export function MentionInput({
  members,
  currentUserId,
  onSend,
  onSendImage,
  uploadingImage = false,
  sending = false,
  placeholder = "Escribe un mensaje...",
  disabled = false,
  replyingTo,
  onCancelReply,
}: MentionInputProps) {
  const [text, setText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<{ start: number; query: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  const filteredMembers = mentionQuery
    ? otherMembers.filter((m) =>
        getMemberName(m).toLowerCase().includes(mentionQuery.query.toLowerCase())
      )
    : otherMembers;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);

    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        setMentionQuery({ start: lastAtIndex, query: textAfterAt });
        setShowDropdown(true);
        setSelectedIndex(0);
        return;
      }
    }
    setShowDropdown(false);
    setMentionQuery(null);
  }, []);

  const insertMention = useCallback(
    (member: MemberLike) => {
      if (!mentionQuery) return;
      const name = getMemberName(member);
      const mentionText = `@[${name}](user:${member.userId})`;
      const beforeAt = text.slice(0, mentionQuery.start);
      const afterQuery = text.slice(mentionQuery.start + 1 + mentionQuery.query.length);
      setText(beforeAt + mentionText + " " + afterQuery);
      setShowDropdown(false);
      setMentionQuery(null);
      inputRef.current?.focus();
    },
    [mentionQuery, text]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showDropdown && filteredMembers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
          if (mentionQuery) {
            e.preventDefault();
            insertMention(filteredMembers[selectedIndex]);
            return;
          }
        } else if (e.key === "Escape") {
          setShowDropdown(false);
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [showDropdown, filteredMembers, selectedIndex, mentionQuery, insertMention]
  );

  const handleSubmit = useCallback(() => {
    if (!text.trim() || sending || !onSend) return;

    const mentionRegex = /@\[([^\]]+)\]\(user:([^)]+)\)/g;
    const mentions: { userId: string; name: string }[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({ userId: match[2], name: match[1] });
    }

    onSend(text.trim(), mentions);
    setText("");
  }, [text, sending, onSend]);

  return (
    <div className="relative">
      {replyingTo && (
        <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-t border-primary-200 dark:border-primary-800 flex items-center gap-2">
          <span className="text-xs text-primary-700 dark:text-primary-300 flex-1 truncate">
            Respondiendo a: {replyingTo.content}
          </span>
          <button
            onClick={onCancelReply}
            className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {showDropdown && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 right-0 mx-3 mb-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg overflow-hidden z-50 max-h-40 overflow-y-auto"
        >
          {filteredMembers.map((member, index) => (
            <button
              key={member.userId}
              onClick={() => insertMention(member)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              }`}
            >
              <Avatar
                name={getMemberName(member)}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {getMemberName(member)}
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {member.role === "admin" ? "Admin" : "Miembro"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-3">
        <div className="flex gap-2 items-end">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onSendImage) {
                onSendImage(file);
              }
              e.target.value = "";
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || !onSendImage}
            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="Subir imagen"
          >
            {uploadingImage ? (
              <span className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5m0 0l5 5m-5-5v12" />
              </svg>
            )}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
          />
          <Button
            type="button"
            loading={sending}
            disabled={!text.trim()}
            onClick={handleSubmit}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}

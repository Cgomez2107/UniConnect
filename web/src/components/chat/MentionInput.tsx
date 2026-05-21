import React, { useState, useRef, useEffect, useCallback } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useMessageValidation, useFileValidation } from "@/hooks/useMessageValidation";
import { useMessageAutocomplete, useFilePicker } from "@/hooks/useMessageAutocomplete";
import { ValidationErrorCode } from "@uniconnect/shared-types";

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

interface FileInfo {
  file: File;
  previewUrl?: string;
}

interface MentionInputProps {
  members: MemberLike[];
  currentUserId: string;
  onSend: (content: string, mentions: { userId: string; name: string }[], options?: { mediaUrl?: string; mediaType?: string }) => void;
  onSendImage?: (file: File) => void;
  onUploadFile?: (file: File) => Promise<{ url: string; type: string }>;
  uploadingImage?: boolean;
  uploadingFile?: boolean;
  sending?: boolean;
  placeholder?: string;
  disabled?: boolean;
  replyingTo?: { content: string } | null;
  onCancelReply?: () => void;
}

const FILE_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MentionInput({
  members,
  currentUserId,
  onSend,
  onSendImage,
  onUploadFile,
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
  const [pendingFile, setPendingFile] = useState<FileInfo | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mentionMapRef = useRef<Map<string, string>>(new Map());

  // Hooks de validación
  const { validationState, validateMessage, clearValidation } = useMessageValidation({
    maxLength: 5000,
    debounceMs: 300,
  });

  const { validateFile } = useFileValidation({ maxSizeMb: 10 });

  // Mapa de usuarios para autocomplete
  const autocompleteUsers = members.map((m) => ({
    id: m.userId,
    name: getMemberName(m),
    email: undefined,
  }));

  const { autocompleteState, handleInput: updateAutocomplete } = useMessageAutocomplete({
    users: autocompleteUsers,
    minChars: 0,
    maxSuggestions: 5,
  });

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

    // Validar mensaje en tiempo real
    validateMessage(value).catch(() => {
      // Ignorar errores de validación async
    });

    // Obtener posición del cursor
    const cursorPosition = e.target.selectionStart || value.length;

    // Actualizar autocomplete
    updateAutocomplete(value, cursorPosition);

    // Lógica original de menciones
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const beforeAt = value.slice(0, lastAtIndex);
      const alreadyMention = /@\S+$/.test(beforeAt);
      if (!alreadyMention) {
        const textAfterAt = value.slice(lastAtIndex + 1);
        if (!textAfterAt.includes(" ")) {
          setMentionQuery({ start: lastAtIndex, query: textAfterAt });
          setShowDropdown(true);
          setSelectedIndex(0);
          return;
        }
      }
    }
    setShowDropdown(false);
    setMentionQuery(null);
  }, [validateMessage, updateAutocomplete]);

  const insertMention = useCallback(
    (member: MemberLike) => {
      if (!mentionQuery) return;
      const name = getMemberName(member);
      mentionMapRef.current.set(name, member.userId);
      const beforeAt = text.slice(0, mentionQuery.start);
      const afterQuery = text.slice(mentionQuery.start + 1 + mentionQuery.query.length);
      setText(beforeAt + `@${name}` + " " + afterQuery);
      setShowDropdown(false);
      setMentionQuery(null);
      inputRef.current?.focus();
    },
    [mentionQuery, text]
  );

  const buildContentWithMentions = useCallback((rawText: string): string => {
    let result = rawText;
    mentionMapRef.current.forEach((userId, name) => {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`@${escapedName}(?![\\wÀ-ÿ])`, "g");
      result = result.replace(regex, `@[${name}](user:${userId})`);
    });
    return result;
  }, []);

  const extractMentions = useCallback((content: string): { userId: string; name: string }[] => {
    const regex = /@\[([^\]]+)\]\(user:([^)]+)\)/g;
    const mentions: { userId: string; name: string }[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      mentions.push({ userId: match[2], name: match[1] });
    }
    return mentions;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (sending || uploadingFile) return;

    // Validar contenido antes de enviar
    if (text.trim()) {
      const validation = await validateMessage(text);
      if (!validation.isValid) {
        // Mostrar error al usuario
        alert(
          validation.error?.message ||
            "Hay un error en tu mensaje. Revísalo e intenta de nuevo."
        );
        return;
      }
    }

    if (pendingFile && onUploadFile) {
      setUploadingFile(true);
      try {
        const { url, type } = await onUploadFile(pendingFile.file);
        const content = text.trim() || pendingFile.file.name;
        const fullContent = buildContentWithMentions(content);
        const mentions = extractMentions(fullContent);
        await onSend(fullContent, mentions, { mediaUrl: url, mediaType: type });
        setPendingFile(null);
        setText("");
        clearValidation();
      } catch (err) {
        console.error("Error al enviar archivo:", err);
      } finally {
        setUploadingFile(false);
      }
      return;
    }

    if (!text.trim() || !onSend) return;
    const fullContent = buildContentWithMentions(text.trim());
    const mentions = extractMentions(fullContent);
    try {
      await onSend(fullContent, mentions);
      setText("");
      clearValidation();
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    }
  }, [text, sending, uploadingFile, pendingFile, onSend, onUploadFile, buildContentWithMentions, extractMentions, validateMessage, clearValidation]);

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
    [showDropdown, filteredMembers, selectedIndex, mentionQuery, insertMention, handleSubmit]
  );

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return;

    // Validar archivo
    const validation = await validateFile(file);
    if (!validation.isValid) {
      alert(validation.error || "Error al validar archivo");
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setPendingFile({ file, previewUrl });
  }, [validateFile]);

  const clearPendingFile = useCallback(() => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  }, [pendingFile]);

  useEffect(() => {
    return () => {
      if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    };
  }, []);

  const canSubmit = (text.trim().length > 0 || !!pendingFile) && !sending && !uploadingFile;

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

      {/* Pending file preview */}
      {pendingFile && (
        <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
          {pendingFile.previewUrl ? (
            <img src={pendingFile.previewUrl} alt="Preview" className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded flex items-center justify-center text-lg">
              📎
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">{pendingFile.file.name}</p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{formatSize(pendingFile.file.size)}</p>
          </div>
          <button
            onClick={clearPendingFile}
            className="text-neutral-400 hover:text-error-600 transition-colors text-sm px-1"
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
              <Avatar name={getMemberName(member)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{getMemberName(member)}</p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {member.role === "admin" ? "Admin" : "Miembro"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-3">
        {/* Validation error display */}
        {validationState.error && (
          <div className="mb-2 p-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-start gap-2">
            <span className="text-error-600 dark:text-error-400 mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-error-700 dark:text-error-300">
                {validationState.error.message}
              </p>
            </div>
          </div>
        )}

        {/* Validation warnings display */}
        {validationState.warnings && validationState.warnings.length > 0 && (
          <div className="mb-2 space-y-1">
            {validationState.warnings.map((warning, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg flex items-start gap-2 ${
                  warning.severity === "warning"
                    ? "bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
                    : "bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800"
                }`}
              >
                <span
                  className={`mt-0.5 ${
                    warning.severity === "warning"
                      ? "text-warning-600 dark:text-warning-400"
                      : "text-info-600 dark:text-info-400"
                  }`}
                >
                  ℹ️
                </span>
                <p
                  className={`text-xs ${
                    warning.severity === "warning"
                      ? "text-warning-700 dark:text-warning-300"
                      : "text-info-700 dark:text-info-300"
                  }`}
                >
                  {warning.message}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Hidden file input for images */}
          <input
            type="file"
            accept="image/*"
            ref={imgInputRef}
            onChange={(e) => {
              handleFileSelect(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
            className="sr-only"
          />
          {/* Hidden file input for any file */}
          <input
            type="file"
            accept={FILE_ACCEPT}
            ref={fileInputRef}
            onChange={(e) => {
              handleFileSelect(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
            className="sr-only"
          />
          {/* Image button */}
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            disabled={uploadingImage || sending || uploadingFile || !onSendImage}
            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="Adjuntar imagen"
          >
            {uploadingImage ? (
              <span className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5m0 0l5 5m-5-5v12" />
              </svg>
            )}
          </button>
          {/* File attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingFile || !onUploadFile}
            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="Adjuntar archivo"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "Añade un mensaje..." : placeholder}
            disabled={disabled || uploadingFile}
            className={`flex-1 px-4 py-2 border bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              validationState.error
                ? "border-error-500 dark:border-error-500 focus:ring-error-200 dark:focus:ring-error-800"
                : validationState.warnings && validationState.warnings.length > 0
                  ? "border-warning-500 dark:border-warning-500 focus:ring-warning-200 dark:focus:ring-warning-800"
                  : "border-neutral-300 dark:border-neutral-600 focus:ring-primary-500"
            }`}
          />
          <div className="flex items-center gap-2">
            {/* Character counter */}
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              <span className={text.length > 4500 ? "text-warning-600" : ""}>
                {text.length}
              </span>
              /{" "}
              <span className={text.length > 4500 ? "text-warning-600" : ""}>
                5000
              </span>
            </div>
            <Button
              type="button"
              loading={sending || uploadingFile}
              disabled={!canSubmit || validationState.error !== undefined}
              onClick={handleSubmit}
            >
              {uploadingFile ? "Subiendo..." : "Enviar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MentionInput;
/**
 * useChatMessageComposer - Headless Hook
 *
 * Manejo del estado del compositor de mensajes de chat (input, typing events, etc.)
 * SIN renderizar UI - solo lógica compartida entre Web y Mobile
 * Expone: valor del mensaje, handlers, métodos para typing notifications
 */

import { useState, useCallback, useRef, useEffect } from "react";

export interface ChatComposerState {
  message: string;
  isTyping: boolean;
  isSending: boolean;
  characterCount: number;
  hasAttachments: boolean;
  attachmentCount: number;
}

export interface ChatComposerHook {
  // State
  state: ChatComposerState;

  // Handlers
  handleMessageChange: (text: string) => void;
  handleMessageClear: () => void;
  handleAttachmentAdd: () => void;
  handleAttachmentRemove: (index: number) => void;
  handleAttachmentsClear: () => void;

  // Methods
  getMessage: () => string;
  canSend: () => boolean;
  startSending: () => void;
  endSending: () => void;
  triggerTypingIndicator: () => void;
  resetComposer: () => void;

  // Computed
  isMessageEmpty: boolean;
  isComposerDisabled: boolean;
  remainingCharacters: number;
  exceedsMaxLength: boolean;
}

/**
 * Max message length (adjust as needed)
 */
const MAX_MESSAGE_LENGTH = 4000;

/**
 * Typing indicator debounce time (ms)
 */
const TYPING_DEBOUNCE_MS = 300;

/**
 * useChatMessageComposer Hook
 * Manejo de estado del compositor de mensajes
 */
export function useChatMessageComposer(): ChatComposerHook {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);

  // Typing debounce ref
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typing indicator handler (in real app, would call API)
  const triggerTypingIndicator = useCallback(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsTyping(true);

    // Send typing event to API/WebSocket
    // In real implementation:
    // await messagingClient.sendTypingIndicator(conversationId);

    // Debounce sending further typing indicators
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, TYPING_DEBOUNCE_MS);
  }, []);

  // Message change handler
  const handleMessageChange = useCallback(
    (text: string) => {
      // Enforce max length
      const trimmed = text.slice(0, MAX_MESSAGE_LENGTH);
      setMessage(trimmed);

      // Trigger typing indicator
      if (trimmed.length > 0 && !isTyping) {
        triggerTypingIndicator();
      }
    },
    [isTyping, triggerTypingIndicator]
  );

  // Clear message
  const handleMessageClear = useCallback(() => {
    setMessage("");
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  // Attachments
  const handleAttachmentAdd = useCallback(() => {
    setAttachmentCount((prev: number) => prev + 1);
  }, []);

  const handleAttachmentRemove = useCallback((index: number) => {
    setAttachmentCount((prev: number) => Math.max(0, prev - 1));
  }, []);

  const handleAttachmentsClear = useCallback(() => {
    setAttachmentCount(0);
  }, []);

  // Get message
  const getMessage = useCallback(() => {
    return message.trim();
  }, [message]);

  // Check if can send
  const canSend = useCallback(() => {
    const trimmed = message.trim();
    return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !isSending;
  }, [message, isSending]);

  // Sending state management
  const startSending = useCallback(() => {
    setIsSending(true);
  }, []);

  const endSending = useCallback(() => {
    setIsSending(false);
  }, []);

  // Reset composer
  const resetComposer = useCallback(() => {
    setMessage("");
    setAttachmentCount(0);
    setIsTyping(false);
    setIsSending(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Computed properties
  const isMessageEmpty = message.trim().length === 0;
  const isComposerDisabled = isSending || message.trim().length === 0;
  const remainingCharacters = MAX_MESSAGE_LENGTH - message.length;
  const exceedsMaxLength = message.length > MAX_MESSAGE_LENGTH;

  const state: ChatComposerState = {
    message,
    isTyping,
    isSending,
    characterCount: message.length,
    hasAttachments: attachmentCount > 0,
    attachmentCount,
  };

  return {
    state,
    handleMessageChange,
    handleMessageClear,
    handleAttachmentAdd,
    handleAttachmentRemove,
    handleAttachmentsClear,
    getMessage,
    canSend,
    startSending,
    endSending,
    triggerTypingIndicator,
    resetComposer,
    isMessageEmpty,
    isComposerDisabled,
    remainingCharacters,
    exceedsMaxLength,
  };
}

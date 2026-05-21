/**
 * useChatMessageComposer - Headless Hook
 *
 * Manejo del estado del compositor de mensajes de chat (input, typing events, etc.)
 * SIN renderizar UI - solo lógica compartida entre Web y Mobile
 * Expone: valor del mensaje, handlers, métodos para typing notifications
 */
export interface ChatComposerState {
    message: string;
    isTyping: boolean;
    isSending: boolean;
    characterCount: number;
    hasAttachments: boolean;
    attachmentCount: number;
}
export interface ChatComposerHook {
    state: ChatComposerState;
    handleMessageChange: (text: string) => void;
    handleMessageClear: () => void;
    handleAttachmentAdd: () => void;
    handleAttachmentRemove: (index: number) => void;
    handleAttachmentsClear: () => void;
    getMessage: () => string;
    canSend: () => boolean;
    startSending: () => void;
    endSending: () => void;
    triggerTypingIndicator: () => void;
    resetComposer: () => void;
    isMessageEmpty: boolean;
    isComposerDisabled: boolean;
    remainingCharacters: number;
    exceedsMaxLength: boolean;
}
/**
 * useChatMessageComposer Hook
 * Manejo de estado del compositor de mensajes
 */
export declare function useChatMessageComposer(): ChatComposerHook;
//# sourceMappingURL=useChatMessageComposer.d.ts.map
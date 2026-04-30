/**
 * Barrel exports para el módulo de decoradores de mensajes
 */

export type { IMessage } from "./IMessage.js";
export { BaseMessage } from "./BaseMessage.js";
export { MessageDecorator } from "./MessageDecorator.js";
export { FileDecorator, type FileMetadata } from "./FileDecorator.js";
export { MentionDecorator, type Mention } from "./MentionDecorator.js";
export { ReactionDecorator, type Reaction } from "./ReactionDecorator.js";
export { extractMentionsFromContent } from "./mentionParser.js";

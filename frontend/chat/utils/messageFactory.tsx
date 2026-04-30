import { 
  BaseMessage, 
  FileMessageDecorator, 
  MentionMessageDecorator, 
  ReactionMessageDecorator, 
  IMessage 
} from '@/chat/models/MessageDecorator';

/**
 * Factory para transformar mensajes crudos de Supabase en objetos decorados.
 * US-D01: Asegura que el patrón Decorator se aplique según los datos disponibles.
 * 
 * @param raw - El objeto JSON crudo proveniente del backend/Supabase.
 * @returns Una instancia de IMessage con todos los decoradores necesarios aplicados.
 */
export function transformRawMessage(raw: any): IMessage {
  // Paso 1: Instancia Base
  let message: IMessage = new BaseMessage(
    raw.id,
    raw.content || '',
    raw.sender_id || raw.senderId,
    new Date(raw.created_at || raw.createdAt)
  );

  // Paso 2: Decorador de Archivo (Media)
  const mediaUrl = raw.media_url || raw.mediaUrl;
  if (mediaUrl) {
    message = new FileMessageDecorator(message, {
      url: mediaUrl,
      mimeType: raw.mime_type || raw.media_type || raw.mediaType || 'application/octet-stream',
      filename: raw.file_name || raw.media_filename || raw.mediaFilename || 'archivo'
    });
  }

  // Paso 3: Decorador de Menciones
  if (Array.isArray(raw.mentions) && raw.mentions.length > 0) {
    message = new MentionMessageDecorator(message, raw.mentions);
  }

  // Paso 4: Decorador de Reacciones
  if (Array.isArray(raw.reactions) && raw.reactions.length > 0) {
    message = new ReactionMessageDecorator(message, raw.reactions);
  }

  return message;
}

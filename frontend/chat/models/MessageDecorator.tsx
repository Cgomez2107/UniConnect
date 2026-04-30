/**
 * frontend/chat/models/MessageDecorator.tsx
 * 
 * Implementación del patrón Decorator para mensajes de chat.
 * US-D01: Componibilidad de archivos, menciones y reacciones.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// 1. Interfaz IMessage siguiendo el contrato del Backend
export interface IMessage {
  readonly id: string;
  readonly content: string;
  readonly senderId: string;
  readonly timestamp: Date;

  getContent(): string;
  getMetadata(): Record<string, any>;
  render(context?: { currentUserId?: string }): React.JSX.Element;
}

// 2. Clase BaseMessage (Implementación Raíz)
export class BaseMessage implements IMessage {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly senderId: string,
    public readonly timestamp: Date
  ) {}

  getContent(): string {
    return this.content;
  }

  getMetadata(): Record<string, any> {
    return {
      id: this.id,
      senderId: this.senderId,
      timestamp: this.timestamp,
    };
  }

  render(context?: { currentUserId?: string }): React.JSX.Element {
    return (
      <Text key="text-base" style={styles.baseText}>
        {this.content}
      </Text>
    );
  }
}

// 3. Clase Abstracta MessageDecorator (Delegación)
export abstract class MessageDecorator implements IMessage {
  constructor(protected message: IMessage) {}

  get id() { return this.message.id; }
  get content() { return this.message.content; }
  get senderId() { return this.message.senderId; }
  get timestamp() { return this.message.timestamp; }

  getContent(): string {
    return this.message.getContent();
  }

  getMetadata(): Record<string, any> {
    return this.message.getMetadata();
  }

  render(context?: { currentUserId?: string }): React.JSX.Element {
    return this.message.render(context);
  }
}

// 4. Decoradores Concretos

// Criterio 3: Soporte para Archivos
export class FileMessageDecorator extends MessageDecorator {
  constructor(
    message: IMessage, 
    private file: { url: string, mimeType: string, filename: string }
  ) {
    super(message);
  }

  override getMetadata() {
    return { ...this.message.getMetadata(), file: this.file };
  }

  override render(context?: { currentUserId?: string }): React.JSX.Element {
    const isImage = this.file.mimeType.startsWith('image/');
    
    const handleOpen = () => {
      if (this.file.url) {
        import('react-native').then(({ Linking }) => {
          Linking.openURL(this.file.url);
        });
      }
    };

    return (
      <View key="decorator-file" style={styles.fileContainer}>
        <TouchableOpacity 
          onPress={handleOpen} 
          activeOpacity={0.7}
          style={{ cursor: 'pointer' } as any}
        >
          {isImage ? (
            <Image 
              source={{ uri: this.file.url }} 
              style={styles.attachedImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fileIconContainer}>
              <MaterialIcons name="insert-drive-file" size={24} color="#0047AB" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {this.file.filename}
                </Text>
                <Text style={{ fontSize: 10, color: '#737373' }}>
                  Haga clic para abrir
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
        {this.message.render(context)}
      </View>
    );
  }
}

// Criterio 4: Resaltado de Menciones
export class MentionMessageDecorator extends MessageDecorator {
  constructor(message: IMessage, private mentions: { userId: string, displayName: string }[]) {
    super(message);
  }

  override getMetadata() {
    return { ...this.message.getMetadata(), mentions: this.mentions };
  }

  override render(context?: { currentUserId?: string }): React.JSX.Element {
    const isMentioned = context?.currentUserId && 
      this.mentions.some(m => m.userId === context.currentUserId || m.displayName === context.currentUserId);

    return (
      <View key="decorator-mention" style={isMentioned ? styles.mentionHighlight : null}>
        <View style={styles.mentionContainer}>
          {this.mentions.map((m, idx) => (
            <Text key={`mention-${idx}`} style={styles.mentionText}>
              @{m.displayName}{' '}
            </Text>
          ))}
        </View>
        {this.message.render(context)}
      </View>
    );
  }
}

// Criterio 5: Gestión de Reacciones
export class ReactionMessageDecorator extends MessageDecorator {
  constructor(message: IMessage, private reactions: { emoji: string, count: number }[]) {
    super(message);
  }

  override getMetadata() {
    return { ...this.message.getMetadata(), reactions: this.reactions };
  }

  override render(context?: { currentUserId?: string }): React.JSX.Element {
    return (
      <View key="decorator-reaction">
        {this.message.render(context)}
        <View style={styles.reactionRow}>
          {this.reactions.map((r, idx) => (
            <View key={`reaction-${idx}`} style={styles.reactionBubble}>
              <Text style={styles.reactionText}>{r.emoji} {r.count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }
}

// 5. Estilos Limpios y Modernos
const styles = StyleSheet.create({
  baseText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1A1A1A',
    paddingVertical: 2,
  },
  fileContainer: {
    marginBottom: 4,
  },
  fileIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F2',
    padding: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
  },
  attachedImage: {
    width: '100%',
    minWidth: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#2D2D2D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mentionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  mentionText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  mentionHighlight: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: -4,
  },
  reactionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  reactionBubble: {
    backgroundColor: '#F0F0F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  reactionText: {
    fontSize: 12,
    color: '#4A4A4A',
  },
});

/**
 * MentionDecorator.ts
 *
 * CA4: Decorador que agrega menciones de usuarios al mensaje.
 * CA4: Sobrescribe render() para resaltar menciones con **@displayName**
 * CA6: Es componible (puede envolver BaseMessage u otro decorador)
 *
 * Flujo:
 * 1. Mensaje base: "Hola @Carlos @Sofia"
 * 2. Decorador: Identifica menciones, valida que usuarios existan
 * 3. render(): "Hola **@Carlos** **@Sofia**" (resaltadas)
 * 4. Resultado: Mensaje con menciones tipadas, válidas y resaltadas
 */

import type { IMessage } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

/**
 * CA4: Metadata de una mención
 */
export interface Mention {
  readonly userId: string;
  readonly displayName: string;
  readonly position: number; // Posición en el texto donde se menciona
}

/**
 * CA4, CA6: Decorador que agrega menciones al mensaje
 *
 * Garantías:
 * - Valida que no haya menciones duplicadas
 * - Valida que userId no sea vacío
 * - Sobrescribe render() para resaltar menciones
 * - Propaga todas las propiedades del mensaje base
 * - Componible: puede ser envuelto por otro decorador
 */
export class MentionDecorator extends MessageDecorator {
  private readonly mentions: readonly Mention[];

  constructor(message: IMessage, mentions: Mention[]) {
    super(message);

    // Validar no hay duplicados
    const userIds = new Set<string>();
    for (const mention of mentions) {
      if (userIds.has(mention.userId)) {
        throw new Error(
          `Mención duplicada para usuario "${mention.userId}"`,
        );
      }
      userIds.add(mention.userId);

      // Validar campos
      if (!mention.userId || mention.userId.trim().length === 0) {
        throw new Error("userId no puede estar vacío");
      }

      if (
        !mention.displayName ||
        mention.displayName.trim().length === 0
      ) {
        throw new Error("displayName no puede estar vacío");
      }

      if (mention.position < 0) {
        throw new Error("position debe ser >= 0");
      }
    }

    this.mentions = Object.freeze(mentions); // Inmutable
  }

  /**
   * Acceso a las menciones
   */
  getMentions(): readonly Mention[] {
    return this.mentions;
  }

  /**
   * Verificar si un usuario fue mencionado
   */
  isMentioned(userId: string): boolean {
    return this.mentions.some((m) => m.userId === userId);
  }

  /**
   * CA4: Implementa getContent() - delega al mensaje interno
   */
  override getContent(): string {
    return this.message.getContent();
  }

  /**
   * CA4: Implementa getMetadata() - combina base + menciones
   */
  override getMetadata(): Record<string, unknown> {
    return {
      ...this.message.getMetadata(),
      mentions: this.mentions.map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
        position: m.position,
      })),
    };
  }

  /**
   * CA4: Sobrescribe render() para resaltar menciones
   * Transforma "Hola @Carlos" en "Hola **@Carlos**"
   * Las menciones se rodean con ** para markdown/bold
   */
  override render(): string {
    const baseRender = this.message.render();
    
    // Crear un mapa de menciones ordenadas por posición (descendente)
    // para no afectar las posiciones al reemplazar
    const mentionsByPosition = [...this.mentions].sort(
      (a, b) => b.position - a.position,
    );

    let result = baseRender;

    for (const mention of mentionsByPosition) {
      // Obtener el fragmento a reemplazar (ej: "@Carlos")
      const atSymbol = result.indexOf("@", mention.position);
      if (atSymbol !== -1) {
        // Encontrar el final de la mención (hasta espacio o fin de string)
        let endPos = atSymbol + 1;
        while (
          endPos < result.length &&
          result[endPos] !== " " &&
          result[endPos] !== "\n"
        ) {
          endPos++;
        }

        // Reemplazar @displayName con **@displayName**
        const fragment = result.substring(atSymbol, endPos);
        result =
          result.substring(0, atSymbol) +
          `**${fragment}**` +
          result.substring(endPos);
      }
    }

    return result;
  }

  /**
   * Serializar: mensaje base + menciones
   */
  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}

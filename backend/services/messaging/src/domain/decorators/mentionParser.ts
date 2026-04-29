/**
 * mentionParser.ts
 *
 * Helper temporal para extraer menciones desde el contenido.
 */

import type { Mention } from "./MentionDecorator.js";

const uuidRegex =
  /@([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/gi;

export function extractMentionsFromContent(content: string): Mention[] {
  const mentions: Mention[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = uuidRegex.exec(content)) !== null) {
    const userId = match[1];
    if (seen.has(userId)) {
      continue;
    }

    seen.add(userId);
    mentions.push({
      userId,
      displayName: userId,
      position: match.index,
    });
  }

  return mentions;
}

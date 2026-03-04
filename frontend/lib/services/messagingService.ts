/**
 * lib/services/messagingService.ts
 * Servicio de mensajería privada 1:1 — US-011
 *
 * Tablas en Supabase:
 *   conversations  { id, participant_a, participant_b, created_at, updated_at }
 *   messages       { id, conversation_id, sender_id, content, created_at, read_at }
 *
 * Para volver al mock en desarrollo: cambiar USE_MOCK a true.
 */

import { supabase } from "@/lib/supabase";
import type { Conversation, Message, SendMessagePayload } from "@/types";

const USE_MOCK = false; // ← true para desarrollo offline

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    participant_a: "mock-me",
    participant_b: "mock-001",
    created_at: "2026-02-28T10:00:00Z",
    updated_at: "2026-03-03T08:30:00Z",
    other_user_id: "mock-001",
    other_user_name: "Carlos Méndez",
    other_user_avatar: null,
    last_message: "¿Te parece el miércoles a las 3pm?",
    last_message_at: "2026-03-03T08:30:00Z",
    unread_count: 2,
  },
  {
    id: "conv-2",
    participant_a: "mock-me",
    participant_b: "mock-002",
    created_at: "2026-03-01T14:00:00Z",
    updated_at: "2026-03-02T20:00:00Z",
    other_user_id: "mock-002",
    other_user_name: "Ana Lucía Ríos",
    other_user_avatar: null,
    last_message: "Perfecto, nos vemos en la biblioteca.",
    last_message_at: "2026-03-02T20:00:00Z",
    unread_count: 0,
  },
  {
    id: "conv-3",
    participant_a: "mock-003",
    participant_b: "mock-me",
    created_at: "2026-02-25T09:00:00Z",
    updated_at: "2026-02-25T09:45:00Z",
    other_user_id: "mock-003",
    other_user_name: "Juan Esteban Gómez",
    other_user_avatar: null,
    last_message: "Listo, te comparto el material.",
    last_message_at: "2026-02-25T09:45:00Z",
    unread_count: 0,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      conversation_id: "conv-1",
      sender_id: "mock-001",
      content: "Hola! Vi tu solicitud de Cálculo II. ¿Todavía tienes espacio?",
      created_at: "2026-03-03T08:00:00Z",
      read_at: "2026-03-03T08:05:00Z",
    },
    {
      id: "msg-2",
      conversation_id: "conv-1",
      sender_id: "mock-me",
      content: "¡Sí! Bienvenido. Somos 3 hasta ahora.",
      created_at: "2026-03-03T08:10:00Z",
      read_at: "2026-03-03T08:15:00Z",
    },
    {
      id: "msg-3",
      conversation_id: "conv-1",
      sender_id: "mock-001",
      content: "Genial. ¿Cuándo se reúnen normalmente?",
      created_at: "2026-03-03T08:20:00Z",
      read_at: "2026-03-03T08:22:00Z",
    },
    {
      id: "msg-4",
      conversation_id: "conv-1",
      sender_id: "mock-me",
      content: "Estamos coordinando. ¿Cuál día te queda mejor?",
      created_at: "2026-03-03T08:25:00Z",
      read_at: null,
    },
    {
      id: "msg-5",
      conversation_id: "conv-1",
      sender_id: "mock-001",
      content: "¿Te parece el miércoles a las 3pm?",
      created_at: "2026-03-03T08:30:00Z",
      read_at: null,
    },
  ],
  "conv-2": [
    {
      id: "msg-6",
      conversation_id: "conv-2",
      sender_id: "mock-me",
      content: "Ana, ¿podemos reunirnos en la biblioteca este viernes?",
      created_at: "2026-03-02T19:45:00Z",
      read_at: "2026-03-02T19:50:00Z",
    },
    {
      id: "msg-7",
      conversation_id: "conv-2",
      sender_id: "mock-002",
      content: "Perfecto, nos vemos en la biblioteca.",
      created_at: "2026-03-02T20:00:00Z",
      read_at: null,
    },
  ],
  "conv-3": [
    {
      id: "msg-8",
      conversation_id: "conv-3",
      sender_id: "mock-003",
      content: "Listo, te comparto el material.",
      created_at: "2026-02-25T09:45:00Z",
      read_at: "2026-02-25T10:00:00Z",
    },
  ],
};

// contador local para IDs de mensajes mock
let mockMsgCounter = 100;

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Devuelve todas las conversaciones del usuario autenticado,
 * ordenadas por última actividad.
 */
export async function getConversations(myUserId: string): Promise<Conversation[]> {
  if (USE_MOCK) {
    // Simular delay de red
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_CONVERSATIONS.sort((a, b) =>
      (b.last_message_at ?? b.updated_at).localeCompare(
        a.last_message_at ?? a.updated_at
      )
    );
  }

  // ── Real (Supabase) ────────────────────────────────────────────────────────
  // Usa la función RPC que devuelve conversaciones enriquecidas (otro usuario,
  // último mensaje, conteo de no leídos) en una sola query SQL.
  const { data, error } = await supabase.rpc("get_conversations_for_user", {
    p_user_id: myUserId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as Conversation[];
}

/**
 * Devuelve todos los mensajes de una conversación, ordenados por fecha.
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_MESSAGES[conversationId] ?? [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

/**
 * Envía un mensaje a una conversación existente.
 */
export async function sendMessage(
  payload: SendMessagePayload,
  senderId: string
): Promise<Message> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const newMsg: Message = {
      id: `msg-${++mockMsgCounter}`,
      conversation_id: payload.conversation_id,
      sender_id: senderId,
      content: payload.content.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
    };
    if (!MOCK_MESSAGES[payload.conversation_id]) {
      MOCK_MESSAGES[payload.conversation_id] = [];
    }
    MOCK_MESSAGES[payload.conversation_id].push(newMsg);

    // Actualizar last_message en la conversación mock
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === payload.conversation_id);
    if (conv) {
      conv.last_message = payload.content.trim();
      conv.last_message_at = newMsg.created_at;
    }
    return newMsg;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ ...payload, sender_id: senderId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Message;
}

/**
 * Obtiene o crea una conversación 1:1 entre dos usuarios.
 * Si ya existe la devuelve; si no, la crea.
 */
export async function getOrCreateConversation(
  myUserId: string,
  otherUserId: string
): Promise<string> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const existing = MOCK_CONVERSATIONS.find(
      (c) =>
        (c.participant_a === myUserId && c.participant_b === otherUserId) ||
        (c.participant_a === otherUserId && c.participant_b === myUserId)
    );
    if (existing) return existing.id;

    const newConv: Conversation = {
      id: `conv-new-${Date.now()}`,
      participant_a: myUserId,
      participant_b: otherUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      other_user_id: otherUserId,
      other_user_name: "Nuevo usuario",
      other_user_avatar: null,
      last_message: null,
      last_message_at: null,
      unread_count: 0,
    };
    MOCK_CONVERSATIONS.unshift(newConv);
    return newConv.id;
  }

  // Buscar conversación existente
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_a.eq.${myUserId},participant_b.eq.${otherUserId}),` +
      `and(participant_a.eq.${otherUserId},participant_b.eq.${myUserId})`
    )
    .maybeSingle();

  if (existing) return existing.id;

  // Crear nueva conversación
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ participant_a: myUserId, participant_b: otherUserId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return created.id;
}

/**
 * Marca todos los mensajes no leídos como leídos.
 */
export async function markConversationRead(
  conversationId: string,
  myUserId: string
): Promise<void> {
  if (USE_MOCK) {
    const msgs = MOCK_MESSAGES[conversationId] ?? [];
    msgs.forEach((m) => {
      if (m.sender_id !== myUserId && !m.read_at) {
        m.read_at = new Date().toISOString();
      }
    });
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === conversationId);
    if (conv) conv.unread_count = 0;
    return;
  }

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", myUserId)
    .is("read_at", null);
}

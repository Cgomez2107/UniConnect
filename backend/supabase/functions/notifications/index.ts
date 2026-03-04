// @ts-nocheck — Este archivo corre en Deno (Edge Functions), no en Node/React Native.
/**
 * supabase/functions/notifications/index.ts
 *
 * Edge Function — Microservicio de Notificaciones
 * Disparada via Supabase Database Webhooks.
 *
 * Eventos que maneja:
 *   messages     INSERT → avisa al destinatario que le llegó un mensaje
 *   applications INSERT → avisa al autor que alguien se postuló
 *   applications UPDATE → avisa al postulante si fue aceptado/rechazado
 *
 * Deploye:
 *   supabase functions deploy notifications
 *
 * Variables de entorno requeridas (supabase/.env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (para leer push_token sin restricciones de RLS)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Cliente con service role para leer perfiles (necesitamos push_token sin RLS)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getPushToken(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("push_token")
    .eq("id", userId)
    .maybeSingle()
  return data?.push_token ?? null
}

async function sendPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  if (!token.startsWith("ExponentPushToken")) {
    console.warn("Token inválido, omitiendo:", token)
    return
  }
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: token, title, body, data, sound: "default" }),
  })
  const json = await res.json()
  if (json?.data?.status === "error") {
    console.error("Error Expo Push:", json.data.message)
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { type, table, record } = payload

    // ── MENSAJES: notificar al destinatario ───────────────────────────────────
    if (table === "messages" && type === "INSERT") {
      const { conversation_id, sender_id, content } = record

      // Obtener la conversación para saber quién es el destinatario
      const { data: conv } = await supabase
        .from("conversations")
        .select("participant_a, participant_b")
        .eq("id", conversation_id)
        .single()

      if (!conv) {
        console.warn("Conversación no encontrada:", conversation_id)
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const recipientId =
        conv.participant_a === sender_id ? conv.participant_b : conv.participant_a

      // Obtener nombre del remitente y token del destinatario en paralelo
      const [senderResult, token] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", sender_id).single(),
        getPushToken(recipientId),
      ])

      if (token) {
        const senderName = senderResult.data?.full_name ?? "Alguien"
        const preview = content.length > 50 ? content.slice(0, 50) + "…" : content
        await sendPush(token, senderName, preview, {
          screen: "chat",
          conversationId: conversation_id,
          senderId: sender_id,
        })
      }
    }

    // ── POSTULACIONES: nueva postulación → notificar al autor ─────────────────
    if (table === "applications" && type === "INSERT") {
      const { request_id, applicant_id } = record

      const { data: studyReq } = await supabase
        .from("study_requests")
        .select("author_id, title")
        .eq("id", request_id)
        .single()

      if (!studyReq) return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })

      const [applicantResult, token] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", applicant_id).single(),
        getPushToken(studyReq.author_id),
      ])

      if (token) {
        const applicantName = applicantResult.data?.full_name ?? "Un estudiante"
        await sendPush(
          token,
          "Nueva postulación",
          `${applicantName} se postuló a "${studyReq.title}"`,
          { screen: "invitaciones", requestId: request_id }
        )
      }
    }

    // ── POSTULACIONES: cambio de estado → notificar al postulante ─────────────
    if (table === "applications" && type === "UPDATE") {
      const { status, applicant_id, request_id } = record
      if (status !== "aceptada" && status !== "rechazada") {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const [reqResult, token] = await Promise.all([
        supabase.from("study_requests").select("title").eq("id", request_id).single(),
        getPushToken(applicant_id),
      ])

      if (token) {
        const title = reqResult.data?.title ?? "una solicitud"
        const emoji = status === "aceptada" ? "✅" : "❌"
        await sendPush(
          token,
          `${emoji} Postulación ${status}`,
          `Tu postulación a "${title}" fue ${status}.`,
          { screen: "invitaciones", requestId: request_id }
        )
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("notifications error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

// @ts-nocheck — Este archivo corre en Deno (Edge Functions), no en Node/React Native.
/**
 * supabase/functions/notifications/index.ts
 *
 * Edge Function — Microservicio de Notificaciones
 *
 * Estado actual: STUB (no desplegado).
 * Para desplegar:  supabase functions deploy notifications
 *
 * Responsabilidades planeadas:
 *   - Notificar al autor cuando alguien se postula a su solicitud
 *   - Notificar al postulante cuando su postulacion es aceptada/rechazada
 *   - Enviar recordatorios de solicitudes por vencer
 *
 * Este servicio se dispara via Supabase Database Webhooks desde las tablas:
 *   - applications  (INSERT -> notificar al autor)
 *   - applications  (UPDATE status -> notificar al postulante)
 *
 * Integracion planeada: Expo Push Notifications via expo-server-sdk
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { type, table, record } = payload

    // Webhook desde Supabase: INSERT en applications
    if (table === "applications" && type === "INSERT") {
      // TODO: fetchear el push token del autor de la solicitud
      // TODO: enviar push via Expo Notifications API
      console.log("Nueva postulacion recibida:", record.id)
    }

    // Webhook desde Supabase: UPDATE de status en applications
    if (table === "applications" && type === "UPDATE") {
      const { status, applicant_id } = record
      if (status === "aceptada" || status === "rechazada") {
        // TODO: fetchear push token del postulante
        // TODO: enviar notificacion con resultado
        console.log(`Postulacion ${record.id} ${status} para usuario ${applicant_id}`)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

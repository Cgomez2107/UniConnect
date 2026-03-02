// @ts-nocheck — Este archivo corre en Deno (Edge Functions), no en Node/React Native.
//               Los imports de deno.land y esm.sh son válidos en ese runtime.
/**
 * supabase/functions/study-groups/index.ts
 *
 * Edge Function — Microservicio de Grupos de Estudio
 *
 * Esta es la plantilla para cuando la lógica de "study_requests" y
 * "applications" crezca lo suficiente como para necesitar su propio servicio.
 *
 * Estado actual: STUB (no desplegado).
 * Para desplegar:  supabase functions deploy study-groups
 *
 * Rutas planeadas:
 *   GET  /study-groups           → lista solicitudes abiertas (feed)
 *   POST /study-groups           → crear solicitud
 *   GET  /study-groups/:id       → detalle
 *   POST /study-groups/:id/apply → postularse
 *   PUT  /study-groups/:id/review→ aceptar/rechazar postulacion
 *
 * Cuando este servicio esté activo, lib/api/client.ts cambia de:
 *   supabase.from("study_requests")...
 * a:
 *   fetch(`${process.env.FUNCTIONS_URL}/study-groups`, ...)
 * Solo ese archivo (client.ts) necesita cambiar. Los hooks y pantallas no.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    }
  )

  const url = new URL(req.url)
  const path = url.pathname.replace("/study-groups", "")

  try {
    // GET /study-groups — Feed de solicitudes abiertas
    if (req.method === "GET" && path === "/") {
      const { data, error } = await supabase
        .from("study_requests")
        .select("*, profiles ( full_name, avatar_url ), subjects ( name )")
        .eq("status", "abierta")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // POST /study-groups — Crear solicitud
    if (req.method === "POST" && path === "/") {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return new Response("Unauthorized", { status: 401 })

      const body = await req.json()
      const { data, error } = await supabase
        .from("study_requests")
        .insert({ author_id: user.id, ...body })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

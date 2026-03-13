// Operaciones de eventos del campus.
// Escritura protegida por RLS: solo admin.

import { supabase } from "@/lib/supabase"
import type { AdminEvent, CampusEvent, CreateEventPayload } from "@/types"

/** Devuelve todos los eventos ordenados por fecha ascendente. */
export async function getEvents(): Promise<CampusEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*, creator:created_by ( full_name )")
    .order("event_date", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as CampusEvent[]
}

/** Devuelve solo los eventos desde hoy en adelante. */
export async function getUpcomingEvents(): Promise<CampusEvent[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("events")
    .select("*, creator:created_by ( full_name )")
    .gte("event_date", now)
    .order("event_date", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as CampusEvent[]
}

export async function createEvent(payload: CreateEventPayload): Promise<CampusEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("*, creator:created_by ( full_name )")
    .single()

  if (error) throw new Error(error.message)
  return data as CampusEvent
}

export async function updateEvent(
  id: string,
  payload: Partial<CreateEventPayload>,
): Promise<CampusEvent> {
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select("*, creator:created_by ( full_name )")
    .single()

  if (error) throw new Error(error.message)
  return data as CampusEvent
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function getAllEvents(): Promise<AdminEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_date, location, category, created_at, creator:created_by ( full_name )")
    .order("event_date", { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    event_date: e.event_date,
    location: e.location,
    category: e.category,
    created_at: e.created_at,
    creator_name: e.creator?.full_name ?? "Admin",
  })) as AdminEvent[]
}

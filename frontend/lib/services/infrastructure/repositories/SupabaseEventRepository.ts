import type { IEventRepository } from "../../domain/repositories/IEventRepository"
import { supabase } from "@/lib/supabase"
import type { CampusEvent } from "@/types"

/**
 * Supabase implementation of IEventRepository.
 * Handles database operations for academic/cultural events.
 * 
 * TODO: Implement
 * - getById()
 * - getAll()
 * - create()
 * - update()
 * - delete()
 */
export class SupabaseEventRepository implements IEventRepository {
  async getById(id: string): Promise<CampusEvent | null> {
    const { data, error } = await supabase
      .from("events")
      .select("*, creator:created_by ( full_name )")
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message)
    }

    return (data as CampusEvent | null) ?? null
  }

  async getUpcoming(): Promise<CampusEvent[]> {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("events")
      .select("*, creator:created_by ( full_name )")
      .gte("event_date", now)
      .order("event_date", { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as CampusEvent[]
  }

  async getAllEvents(): Promise<CampusEvent[]> {
    throw new Error("Not implemented in Supabase fallback")
  }

  async create(_userId: string, _payload: any): Promise<CampusEvent> {
    throw new Error("Not implemented in Supabase fallback")
  }

  async update(_eventId: string, _userId: string, _payload: any): Promise<void> {
    throw new Error("Not implemented in Supabase fallback")
  }

  async delete(_eventId: string, _userId: string): Promise<void> {
    throw new Error("Not implemented in Supabase fallback")
  }

  async getByAuthor(_userId: string): Promise<CampusEvent[]> {
    throw new Error("Not implemented in Supabase fallback")
  }

  async updateStatus(_eventId: string, _status: string): Promise<void> {
    throw new Error("Not implemented in Supabase fallback")
  }
}

import { supabase } from "@/lib/supabase"

export async function lookupUserNames(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {}
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds)
  const map: Record<string, string> = {}
  for (const p of profiles ?? []) {
    map[p.id] = p.full_name ?? "Usuario desconocido"
  }
  return map
}

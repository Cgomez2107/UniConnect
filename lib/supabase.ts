import { createClient } from "@supabase/supabase-js"

const url =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL

const key =
  process.env.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error("Missing Supabase env variables")
}

export const supabase = createClient(url, key)
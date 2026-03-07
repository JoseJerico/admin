import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.PARCEL_SUPABASE_URL
const supabaseAnonKey = process.env.PARCEL_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing PARCEL_SUPABASE_URL in .env")
}

if (!supabaseAnonKey) {
  throw new Error("Missing PARCEL_SUPABASE_ANON_KEY in .env")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
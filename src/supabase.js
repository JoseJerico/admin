import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.PARCEL_SUPABASE_URL
const supabaseAnonKey = process.env.PARCEL_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
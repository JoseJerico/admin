// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple authService wrapper
export const authService = {
  getCurrentUser: () => supabase.auth.getUser().then(res => res.data.user),
  onAuthStateChange: (callback) => supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null)
  }),
  logout: () => supabase.auth.signOut(),
};

console.log("Supabase client loaded:", supabase);
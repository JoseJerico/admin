
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const authService = {
  getCurrentUser: () =>
    supabase.auth.getUser().then(res => res.data.user),
  onAuthStateChange: (callback) =>
    supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    }),
  logout: () => supabase.auth.signOut(),
};
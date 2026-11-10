// Creates one shared Supabase client for the whole app.
// Other files import it like: import { supabase } from '../lib/supabaseClient'

import { createClient } from '@supabase/supabase-js'

// Vite reads these from .env.local (only variables starting with VITE_ are exposed).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail early with a clear message if the environment variables are missing.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

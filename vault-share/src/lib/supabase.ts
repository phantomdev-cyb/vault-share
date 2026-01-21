import { createClient } from '@supabase/supabase-js';

// 1. Environment Variable Extraction
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Pre-Flight Security Check
// If these are missing, the app refuses to boot. This safeguards against misconfiguration.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'CRITICAL SECURITY ERROR: Supabase environment variables are missing. ' +
    'Please check your .env file or hosting configuration.'
  );
}

// 3. Client Initialization
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // User stays logged in secure via LocalStorage
    autoRefreshToken: true, // Token rotates automatically (prevents replay attacks)
  },
});
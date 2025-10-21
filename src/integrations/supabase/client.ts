import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check and error handling
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // This will throw an error and be visible in the browser console
  // and Next.js terminal during development/build.
  throw new Error("Missing Supabase environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.");
}

// Initialize the client only if variables are present
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

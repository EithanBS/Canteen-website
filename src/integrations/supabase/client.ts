import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dlhtpuggplyccfcwyoha.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaHRwdWdncGx5Y2NmY3d5b2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTA4OTgsImV4cCI6MjA3NjYyNjg5OH0.gywp1wXMXIB7hZMTjgqaH2JG1JHv7SeAELTg8KvuQzE"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

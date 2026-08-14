import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ygmjsualluwltbwkawhj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbWpzdWFsbHV3bHRid2thd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjMxNzcsImV4cCI6MjEwMjAzOTE3N30.kHY6axy6kI1oPP4Pm0c7l7Hsr_DO8XfVemsSvs9p_c0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

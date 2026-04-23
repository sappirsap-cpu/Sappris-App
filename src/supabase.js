// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgwacddfwhrdeckmszdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnd2FjZGRmd2hyZGVja21zemRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzQ1NTYsImV4cCI6MjA5MjE1MDU1Nn0.Ykad5hC0UcHozcW1HMHzAhWrWHeNGKUmyq67U_gbsm0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

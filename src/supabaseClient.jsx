// =====================================================================================
//                          FRONTEND: supabaseClient.jsx
// =====================================================================================
// This file exports the Supabase client instance, making it reusable across the app.
// Credentials are now loaded from environment variables for security.
// =====================================================================================

import { createClient } from '@supabase/supabase-js';

// ตั้งค่า Supabase - ใช้ Environment Variables เพื่อความปลอดภัย
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

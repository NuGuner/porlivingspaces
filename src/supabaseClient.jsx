// =====================================================================================
//                          FRONTEND: supabaseClient.jsx
// =====================================================================================
// This file exports the Supabase client instance, making it reusable across the app.
// You must replace the placeholders with your actual Supabase project credentials.
// =====================================================================================

import { createClient } from '@supabase/supabase-js';

// ตั้งค่า Supabase - โปรดแทนที่ URL และ Key ด้วยค่าจริงของคุณ
// หากคุณรันโค้ดนี้ใน Canvas, คุณต้องกำหนดค่าเหล่านี้เป็น Environment Variables
const supabaseUrl = 'https://cznqkhweelhqnkfmhcdk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bnFraHdlZWxocW5rZm1oY2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA4MTgsImV4cCI6MjA3MDcxNjgxOH0.svutYRzlHTjstSfxISx90F2A5QtQzpYhoctNi5uhq9Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

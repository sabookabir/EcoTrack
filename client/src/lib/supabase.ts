import { createClient } from '@supabase/supabase-js';

// Load Supabase environment variables from Vite env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get headers with JWT token for backend API requests
export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.access_token) {
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

// REST Backend base URL
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
export const BASE_URL = import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL.replace('/api', '') : 'http://localhost:5000';

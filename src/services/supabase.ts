import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment credentials (if provided)
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const envKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Local storage override allows user to input or test credentials inside the app UI
const customUrl = typeof window !== 'undefined' ? localStorage.getItem('schoolsafe_custom_supabase_url') || '' : '';
const customKey = typeof window !== 'undefined' ? localStorage.getItem('schoolsafe_custom_supabase_key') || '' : '';

const activeUrl = customUrl || envUrl;
const activeKey = customKey || envKey;

export const isSupabaseConfigured = Boolean(activeUrl && activeKey && activeUrl.startsWith('http'));

let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(activeUrl, activeKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export function getSupabase(): SupabaseClient | null {
  return supabaseClient;
}

export function updateCustomSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('schoolsafe_custom_supabase_url', url.trim());
      localStorage.setItem('schoolsafe_custom_supabase_key', key.trim());
    } else {
      localStorage.removeItem('schoolsafe_custom_supabase_url');
      localStorage.removeItem('schoolsafe_custom_supabase_key');
    }
    window.location.reload();
  }
}

export function getCustomSupabaseConfig() {
  return {
    url: customUrl || envUrl,
    key: customKey || envKey,
    isEnv: Boolean(envUrl && envKey),
    isConfigured: isSupabaseConfigured,
  };
}

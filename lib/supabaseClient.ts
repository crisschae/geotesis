import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 🛑 Protección crítica para evitar crash en APK
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase env vars missing', {
    supabaseUrl,
    supabaseAnonKey,
  });
  throw new Error('Supabase environment variables are not defined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // 🔑 CLAVE en apps móviles
  },
});

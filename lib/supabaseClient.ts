import { createClient } from '@supabase/supabase-js';

// Importante:
// - Configura estas variables en tu archivo .env local de Expo.
// - Deben empezar con EXPO_PUBLIC_ para que estén disponibles en el cliente.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



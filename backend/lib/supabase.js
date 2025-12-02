import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// En local usamos anonKey. Para producción, usaremos SERVICE_ROLE SOLO en el backend.
export const supabase = createClient(supabaseUrl, anonKey);

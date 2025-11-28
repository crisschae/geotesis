import { supabase } from './supabaseClient';
import type { ClienteApp, TipoCombustible } from './types';

export async function getPerfilClienteActual(): Promise<ClienteApp | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from('cliente_app')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  return data as ClienteApp;
}

export async function actualizarPreferenciasCombustible(params: {
  tipo_combustible: TipoCombustible;
  rendimiento_km_l: number;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('No hay sesión activa');

  const { error } = await supabase
    .from('cliente_app')
    .update({
      tipo_combustible: params.tipo_combustible,
      rendimiento_km_l: params.rendimiento_km_l,
    })
    .eq('auth_user_id', user.id);

  if (error) throw error;
}

export async function actualizarUbicacionCliente(latitud: number, longitud: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('No hay sesión activa');

  const { error } = await supabase
    .from('cliente_app')
    .update({
      latitud,
      longitud,
    })
    .eq('auth_user_id', user.id);

  if (error) throw error;
}



import { supabase } from './supabaseClient';

export type FerreteriaCercana = {
  id_ferreteria: string;
  razon_social: string;
  direccion: string | null;
  telefono: string | null;
  latitud: number;
  longitud: number;
  distancia_km: number;
  distancia_google?: string; 
  duracion_google?: string;
};

type ParamsBusquedaFerreterias = {
  latitud: number;
  longitud: number;
  radioKm?: number;
  busqueda?: string;
};

export async function getFerreteriasCercanas({
  latitud,
  longitud,
  radioKm = 5,
  busqueda,
}: ParamsBusquedaFerreterias): Promise<FerreteriaCercana[]> {
  const { data, error } = await supabase.rpc('buscar_ferreterias_cercanas', {
    p_lat: latitud,
    p_lng: longitud,
    p_radio_km: radioKm,
    p_busqueda: busqueda ?? null,
  });

  if (error) {
    console.error('Error al buscar ferreterías cercanas', error);
    throw error;
  }

  return (data ?? []) as FerreteriaCercana[];
}



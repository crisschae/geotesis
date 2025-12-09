import { supabase } from "./supabaseClient";

/**
 * Tipo que representa una ferretería cercana.
 * Mantiene compatibilidad con tu RPC y con MapaFerreterias.tsx.
 */
export type FerreteriaCercana = {
  id_ferreteria: string;
  razon_social: string;
  direccion: string | null;
  telefono: string | null;
  latitud: number;
  longitud: number;
  distancia_km: number;          // generado por el RPC
  distancia_google?: string;     // opcional
  duracion_google?: string;      // opcional
};

/**
 * Parámetros para buscar ferreterías cercanas.
 */
type ParamsBusquedaFerreterias = {
  latitud: number;
  longitud: number;
  radioKm?: number;
  busqueda?: string;
};

/**
 * Obtiene ferreterías cercanas usando el RPC buscar_ferreterias_cercanas.
 * Este RPC ya consulta v_ferreteria_visible, por lo que solo trae ferreterías activas.
 */
export async function getFerreteriasCercanas({
  latitud,
  longitud,
  radioKm = 5,
  busqueda,
}: ParamsBusquedaFerreterias): Promise<FerreteriaCercana[]> {
  const { data, error } = await supabase.rpc("buscar_ferreterias_cercanas", {
    p_lat: latitud,
    p_lng: longitud,
    p_radio_km: radioKm,
    p_busqueda: busqueda ?? null,
  });

  if (error) {
    console.error("Error al buscar ferreterías cercanas:", error);
    throw error;
  }

  // Supabase devuelve "unknown", así que forzamos a nuestro tipo:
  return (data ?? []) as FerreteriaCercana[];
}

import { supabase } from "./supabaseClient";

export interface FerreteriaCercana {
  id_ferreteria: string;
  razon_social: string;
  latitud: number;
  longitud: number;
  distancia_km: number;
  // ... otros campos
}

export async function getFerreteriasCercanas({
  latitud,
  longitud,
  radioKm = 20,
}: {
  latitud: number;
  longitud: number;
  radioKm: number;
}) {
  // Llamamos a la función SQL que acabamos de crear
  const { data, error } = await supabase.rpc("get_ferreterias_cercanas", {
    lat: latitud,
    long: longitud,
    radio_km: radioKm,
  });

  if (error) {
    console.error("Error obteniendo ferreterías:", error);
    return [];
  }

  return data as FerreteriaCercana[];
}
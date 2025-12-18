import { supabase } from "./supabaseClient";
import { calcularDistanciaHaversine } from "./utils";

export async function getProductosCercanos(
  lat: number,
  lon: number,
  radioKm = 10
) {
  console.log("🚨 ENTRO A getProductosCercanos", { lat, lon, radioKm });
  // 🔹 Obtener ferreterías
  const { data: ferreterias, error: err1 } = await supabase
    .from("ferreteria")
    .select("id_ferreteria, razon_social, latitud, longitud");

  if (err1 || !ferreterias) {
    console.error("Error cargando ferreterías:", err1);
    return [];
  }

  // 🔹 Filtrar ferreterías dentro del radio especificado
  const cercanas = ferreterias.filter((f) => {
    const distancia = calcularDistanciaHaversine(
      lat,
      lon,
      Number(f.latitud),
      Number(f.longitud)
    );
    return distancia <= radioKm;
  });

  const ids = cercanas.map((f) => f.id_ferreteria);
  if (ids.length === 0) return [];

  // 🔹 Buscar productos de esas ferreterías
  const { data: productos, error: err2 } = await supabase
    .from("producto")
    .select(
      "id_producto, nombre, precio, imagenes, imagen_url, id_ferreteria, ferreteria(razon_social)"
    )
    .in("id_ferreteria", ids);

    if (err2 || !productos) {
      console.error("Error cargando productos cercanos:", err2);
      return [];
    }

    // 🔴 CONSOLE EXACTO AQUÍ
    console.log("DEBUG SERVICE productos cercanos:", productos);

    return productos;

}

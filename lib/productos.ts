import { supabase } from "./supabaseClient";
import { calcularDistanciaHaversine } from "./utils"; // 🔹 Asegúrate de tener esta línea

// 🔹 Cargar todos los productos con su ferretería
export async function fetchProductos() {
  const { data, error } = await supabase
    .from("producto")
    .select(`
      id_producto,
      nombre,
      descripcion,
      precio,
      stock,
      imagenes,
      sku,
      id_ferreteria,
      ferreteria (
        id_ferreteria,
        razon_social,
        direccion,
        telefono,
        latitud,
        longitud
      )
    `);

  if (error) {
    console.error("Error fetching productos:", error);
    return [];
  }

  return data ?? [];
}

/**
 * 🔎 Devuelve el producto más barato de una ferretería
 */
export async function getProductoMasBaratoPorFerreteria(id_ferreteria: string) {
  try {
    const { data, error } = await supabase
      .from("producto")
      .select("id_producto, nombre, precio")
      .eq("id_ferreteria", id_ferreteria)
      .gt("stock", 0)
      .order("precio", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error obteniendo producto más barato:", err);
    return null;
  }
}

/**
 * 🧭 Obtiene productos de ferreterías dentro de un radio (por ubicación)
 */
export async function getProductosCercanos(
  lat: number,
  lon: number,
  radioKm = 10
) {
  // 1️⃣ Obtener ferreterías
  const { data: ferreterias, error: err1 } = await supabase
    .from("ferreteria")
    .select("id_ferreteria, latitud, longitud");

  if (err1 || !ferreterias) {
    console.error("Error cargando ferreterías:", err1);
    return [];
  }

  // 2️⃣ Filtrar por distancia
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

  // 3️⃣ Traer productos de esas ferreterías
  const { data: productos, error: err2 } = await supabase
    .from("producto")
    .select(`
      id_producto,
      nombre,
      precio,
      imagenes,
      id_ferreteria,
      ferreteria(razon_social)
    `)
    .in("id_ferreteria", ids);

  if (err2) {
    console.error("Error cargando productos cercanos:", err2);
    return [];
  }

  return productos ?? [];
}


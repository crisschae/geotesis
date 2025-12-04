import { supabase } from "./supabaseClient";

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

  // ❗ NO convertir a Producto[]
  return data ?? [];
}


/**
 * 🔎 Devuelve el producto más barato de una ferretería
 * @param id_ferreteria string - ID de la ferretería a consultar
 * @returns { id_producto, nombre, precio } o null si no hay productos
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
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

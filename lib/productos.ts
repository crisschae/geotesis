import { supabase } from './supabaseClient';
import type { Producto } from './types';

export async function getProductoMasBaratoPorFerreteria(
  id_ferreteria: string
): Promise<Producto | null> {
  const { data, error } = await supabase
    .from('producto')
    .select('*')
    .eq('id_ferreteria', id_ferreteria)
    .gt('stock', 0)
    .order('precio', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log('Error buscando producto más barato:', error);
    return null;
  }

  return (data as Producto) ?? null;
}




-- database_function.sql
CREATE OR REPLACE FUNCTION fn_buscar_opciones_cotizacion(
  p_productos_busqueda TEXT[],
  p_max_resultados INT
)
RETURNS TABLE (
  id_ferreteria UUID,
  razon_social TEXT,
  latitud NUMERIC,
  longitud NUMERIC,
  productos JSON
) AS $$
BEGIN
  RETURN QUERY
  WITH ferreterias_con_productos AS (
    -- Encuentra ferreterías que tienen todos los productos buscados
    SELECT
      f.id_ferreteria
    FROM ferreteria f
    JOIN producto p ON f.id_ferreteria = p.id_ferreteria
    WHERE p.nombre = ANY(p_productos_busqueda)
    GROUP BY f.id_ferreteria
    HAVING COUNT(DISTINCT p.nombre) = ARRAY_LENGTH(p_productos_busqueda, 1)
  ),
  productos_de_ferreterias AS (
    -- Obtiene los detalles de los productos para esas ferreterías
    SELECT
      p.id_ferreteria,
      p.id_producto,
      p.nombre,
      p.precio,
      p.stock
    FROM producto p
    WHERE p.id_ferreteria IN (SELECT fcp.id_ferreteria FROM ferreterias_con_productos fcp)
      AND p.nombre = ANY(p_productos_busqueda)
  )
  -- Agrupa los productos por ferretería en un JSON
  SELECT
    f.id_ferreteria,
    f.razon_social::TEXT,
    f.latitud,
    f.longitud,
    json_agg(json_build_object(
      'id_producto', pdf.id_producto,
      'nombre', pdf.nombre,
      'precio', pdf.precio,
      'stock', pdf.stock
    )) AS productos
  FROM ferreteria f
  JOIN productos_de_ferreterias pdf ON f.id_ferreteria = pdf.id_ferreteria
  GROUP BY f.id_ferreteria
  LIMIT p_max_resultados;
END;
$$ LANGUAGE plpgsql;

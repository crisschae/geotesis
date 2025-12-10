# TODO: Modificar lógica de cotizaciones

## Paso 1: Modificar app/(tabs)/quotes.tsx
- Actualizar la pantalla de cotizaciones para mostrar la opción más conveniente con ahorros en porcentaje y pesos.
- Agregar controles de usuario para ordenar por costo estimado o tiempo mínimo.
- Mostrar múltiples opciones (2-3) en paralelo si están disponibles en detalle_costos.

## Paso 2: Modificar app/(tabs)/quote-detail/[id].tsx
- [x] Actualizar la pantalla de detalle para mostrar múltiples opciones de cotización en paralelo.
- [x] Comparar subtotal, costo de viaje, total final, distancia, ferretería recomendada.
- [x] Resaltar la opción más conveniente con ahorros.

## Paso 3: Verificar estructura de datos
- Asegurar que detalle_costos en la base de datos soporte un array de opciones.
- Si es necesario, actualizar consultas para incluir múltiples opciones.

## Paso 4: Pruebas y ajustes
- Probar las modificaciones en la app.
- Ajustar estilos y lógica según sea necesario.

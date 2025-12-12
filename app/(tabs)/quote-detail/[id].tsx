import { supabase } from "@/lib/supabaseClient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/services/cartStore"; // Asegúrate de tener este import
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DARK_BG = "#0b1220";
const CARD_BG = "#0f172a";
const ORANGE = "#ff8a29";
const GREEN = "#10b981";

type CotizacionDetalle = {
  id_producto: string | null;
  nombre_producto_snapshot: string | null;
  cantidad: number | null;
  precio_unitario_snapshot: number | null;
  producto?: any; // Para obtener info extra si es necesario
};

type CotizacionHeader = {
  id_cotizacion: string;
  created_at: string;
  expires_at: string;
  estado: string;
  subtotal_productos: number | null;
  costo_viaje: number | null;
  costo_total: number | null;
  distancia_km: number | null;
  duracion_min: number | null;
  detalle_costos: any; // Aquí vendrá el Array de opciones
  id_ferreteria_recomendada?: string | null;
  ferreteria?: {
    razon_social?: string | null;
    direccion?: string | null;
    telefono?: string | null;
  } | null;
};

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addToCart);

  const [header, setHeader] = useState<CotizacionHeader | null>(null);
  const [detalles, setDetalles] = useState<CotizacionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // Para el loading al seleccionar
  const [sortBy, setSortBy] = useState<"cost" | "time">("cost");

  // 1. CARGAR DATOS
  const loadData = async () => {
    try {
      if (!id) throw new Error("ID no proporcionado");
      setLoading(true);

      const { data: head, error: hErr } = await supabase
        .from("cotizacion")
        .select(
          `
            *,
            ferreteria:id_ferreteria_recomendada (
              razon_social,
              direccion,
              telefono
            )
          `
        )
        .eq("id_cotizacion", id)
        .maybeSingle();

      if (hErr) throw hErr;
      if (!head) throw new Error("Cotización no encontrada");
      setHeader(head as CotizacionHeader);

      const { data: det, error: dErr } = await supabase
        .from("cotizacion_detalle")
        .select(
          `
            id_producto, 
            nombre_producto_snapshot, 
            cantidad, 
            precio_unitario_snapshot,
            producto:id_producto ( imagenes, id_ferreteria )
          `
        )
        .eq("id_cotizacion", id);

      if (dErr) throw dErr;
      setDetalles(det || []);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo cargar la cotización");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // 2. PROCESAR OPCIONES (JSON a Array)
  const options = useMemo(() => {
    if (!header) return [];
    // Si detalle_costos es un array, lo usamos. Si es null o objeto único, lo adaptamos.
    const rawOptions = Array.isArray(header.detalle_costos)
      ? header.detalle_costos
      : [header.detalle_costos].filter(Boolean);

    // Si no hay opciones guardadas en el JSON, construimos una basada en los datos actuales (fallback)
    if (rawOptions.length === 0) {
      return [
        {
          id: 0,
          subtotal: header.subtotal_productos ?? 0,
          costo_viaje: header.costo_viaje ?? 0,
          total: header.costo_total ?? 0,
          distancia: header.distancia_km ?? 0,
          duracion: header.duracion_min ?? 0,
          ferreteria: header.ferreteria?.razon_social || "Ferretería Actual",
          id_ferreteria: header.id_ferreteria_recomendada,
        },
      ];
    }

    return rawOptions.map((opt: any, index: number) => ({
      ...opt,
      id_local: index, // Identificador local para el map key
      // Aseguramos nombres de campos
      subtotal: opt.subtotal ?? opt.subtotal_productos ?? 0,
      total: opt.total ?? opt.costo_total ?? 0,
      ferreteriaName:
        opt.ferreteria?.razon_social ||
        opt.ferreteria ||
        "Ferretería Opción " + (index + 1),
    }));
  }, [header]);

  // 3. ORDENAR OPCIONES
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      if (sortBy === "cost") {
        return a.total - b.total;
      } else {
        return a.duracion - b.duracion;
      }
    });
  }, [options, sortBy]);

  const bestOption = sortedOptions[0];
  const nextBest = sortedOptions[1];

  // Cálculo de ahorro visual
  const savings = useMemo(() => {
    if (!nextBest || !bestOption) return { amount: 0, percent: 0 };
    const amount = nextBest.total - bestOption.total;
    const percent = nextBest.total > 0 ? (amount / nextBest.total) * 100 : 0;
    return { amount, percent };
  }, [bestOption, nextBest]);

  // 4. LÓGICA: SELECCIONAR OPCIÓN
  // 4. LÓGICA: SELECCIONAR OPCIÓN (CORREGIDA)
  const handleSelectOption = async (option: any) => {
    // Verificación de seguridad
    if (!option.id_ferreteria) {
      Alert.alert("Error", "Esta opción no tiene un ID de ferretería válido.");
      return;
    }

    Alert.alert(
      "Confirmar Cambio",
      `¿Deseas cambiar tu cotización a "${option.ferreteriaName}" por $${option.total.toFixed(0)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, cambiar",
          onPress: async () => {
            try {
              setProcessing(true);

              // ACTUALIZAMOS TODOS LOS CAMPOS CLAVE
              // Ahora cambiamos también 'id_ferreteria' y 'total_estimada'
              // para que esta opción sea la OFICIAL.
              const { error } = await supabase
                .from("cotizacion")
                .update({
                  id_ferreteria: option.id_ferreteria,             // <--- IMPORTANTE: Cambia el proveedor principal
                  id_ferreteria_recomendada: option.id_ferreteria, // <--- La marca como seleccionada
                  total_estimada: option.total,                    // <--- Actualiza el precio principal en la lista
                  
                  // Actualizamos los detalles de costos también
                  costo_total: option.total,
                  subtotal_productos: option.subtotal,
                  costo_viaje: option.costo_viaje,
                  distancia_km: option.distancia,
                  duracion_min: option.duracion,
                  
                  // Usamos un estado válido (según tu DB: vigente o convertida)
                  estado: "vigente", 
                })
                .eq("id_cotizacion", id);

              if (error) throw error;

              Alert.alert("¡Cotización Actualizada!", "Has seleccionado una nueva opción.", [
                { text: "OK", onPress: () => loadData() } // Recargamos para ver los cambios
              ]);

            } catch (err: any) {
              Alert.alert("Error al actualizar", err.message);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // 5. LÓGICA: AGREGAR AL CARRITO (VERSIÓN FINAL CORREGIDA)
 // 5. LÓGICA: AGREGAR AL CARRITO (VERSIÓN DEFINITIVA)
  // 5. LÓGICA: AGREGAR AL CARRITO (ESTRATEGIA DOBLE VERIFICACIÓN)
  const executeAddToCart = (selectedOption: any) => {
    try {
      if (detalles.length === 0) {
        Alert.alert("Error", "No hay productos en esta cotización");
        return;
      }

      // --- DEBUG POTENTE ---
      // Esto imprimirá en tu terminal qué productos TIENE la opción que elegiste.
      console.log("=== DIAGNÓSTICO DE OPCIÓN SELECCIONADA ===");
      console.log("Ferretería:", selectedOption.ferreteriaName);
      console.log("Productos Disponibles en JSON:", JSON.stringify(selectedOption.productos, null, 2));
      console.log("==========================================");

      let debugMensaje = "";

      detalles.forEach((d) => {
        // PREPARACIÓN DE DATOS PARA COMPARAR
        const idDetalle = String(d.id_producto).trim().toLowerCase();
        const nombreDetalle = String(d.nombre_producto_snapshot).trim().toLowerCase();

        // INTENTO 1: BUSCAR POR ID EXACTO
        let productoEncontrado = selectedOption.productos?.find((p: any) => 
          String(p.id_producto).trim().toLowerCase() === idDetalle
        );

        // INTENTO 2: SI FALLA EL ID, BUSCAR POR NOMBRE (PLAN B)
        if (!productoEncontrado) {
          console.log(`⚠️ ID falló para ${d.nombre_producto_snapshot}. Intentando por nombre...`);
          productoEncontrado = selectedOption.productos?.find((p: any) => 
            String(p.nombre).trim().toLowerCase() === nombreDetalle
          );
        }

        // DETERMINAR PRECIO FINAL
        let precioFinal = 0;
        let metodo = "";

        if (productoEncontrado) {
          precioFinal = Number(productoEncontrado.precio);
          metodo = "✅ ENCONTRADO (Precio Nuevo)";
        } else {
          // Si falla todo, usamos el precio original (el barato)
          precioFinal = Number(d.precio_unitario_snapshot || 0);
          metodo = "❌ NO ENCONTRADO (Precio Viejo)";
        }

        debugMensaje += `Prod: ${d.nombre_producto_snapshot}\nEstado: ${metodo}\nPrecio Final: ${precioFinal}\n\n`;

        addToCart({
          id_producto: d.id_producto!,
          nombre: d.nombre_producto_snapshot || "Producto",
          precio: precioFinal, 
          quantity: d.cantidad || 1,
          id_ferreteria: selectedOption.id_ferreteria,
          imagenes: d.producto?.imagenes || [],
        });
      });

      // ALERTA DE VERIFICACIÓN
      Alert.alert(
        "Diagnóstico de Precios", 
        debugMensaje,
        [
          { 
            text: "Ir al Carrito", 
            onPress: () => router.push("/(tabs)/CartScreen") 
          }
        ]
      );

    } catch (error) {
      console.error("Error crítico agregando al carrito:", error);
      Alert.alert("Error", "No se pudo agregar al carrito.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={ORANGE} size="large" />
        <Text style={styles.loaderText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!header) return null;

  return (
    <View style={styles.container}>
      {/* HEADER SUPERIOR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/quotes")}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Detalle de Cotización</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        
        {/* TARJETA RESUMEN GENERAL */}
        <View style={styles.card}>
          <Text style={[styles.title, { textAlign: "center" }]}>
            Cotización #{header.id_cotizacion.slice(0, 8)}
          </Text>
          <Text style={[styles.subtitle, { textAlign: "center" }]}>
            Creada: {new Date(header.created_at).toLocaleDateString("es-CL")}
          </Text>
          <View style={styles.badgeRow}>
            <Text
              style={[
                styles.badge,
                header.estado === "confirmada" && { backgroundColor: GREEN },
              ]}
            >
              {header.estado.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* BOTONES DE ORDENAMIENTO */}
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "cost" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("cost")}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "cost" && styles.sortButtonTextActive,
              ]}
            >
              Menor costo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === "time" && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy("time")}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === "time" && styles.sortButtonTextActive,
              ]}
            >
              Menor tiempo
            </Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE OPCIONES (LAS 3 COTIZACIONES) */}
        <Text style={styles.sectionTitle}>Opciones disponibles</Text>
        
        {processing && <ActivityIndicator color={ORANGE} style={{marginBottom: 10}} />}

        {sortedOptions.map((option, index) => {
          // Verificamos si esta es la opción seleccionada actualmente
          const isSelected = header.id_ferreteria_recomendada === option.id_ferreteria;
          
          // Solo mostramos el borde naranja de "Mejor opción" si:
          // 1. Es la primera (índice 0)
          // 2. Y ADEMÁS, el usuario NO ha seleccionado una opción diferente todavía (o seleccionó esta misma)
          const showBestPriceStyle = index === 0 && (!header.id_ferreteria_recomendada || isSelected);

          return (
            <View
              key={index}
              style={[
                styles.metricsCard,
                showBestPriceStyle && styles.bestOptionCard, // Borde naranja condicional
                isSelected && { borderColor: GREEN, borderWidth: 2 } // Borde verde (prioridad)
              ]}
            >
              {/* Banner de Ahorro para la primera opción */}
              {index === 0 && savings.amount > 0 && sortBy === 'cost' && (
                <View style={styles.savingsBanner}>
                  <Text style={styles.savingsText}>
                    ¡Mejor precio! Ahorras ${savings.amount.toFixed(0)}
                  </Text>
                </View>
              )}
              
              {isSelected && (
                 <View style={[styles.savingsBanner, { backgroundColor: GREEN }]}>
                  <Text style={styles.savingsText}>OPCIÓN SELECCIONADA</Text>
                </View>
              )}

              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>
                  {option.ferreteriaName}
                </Text>
                {/* Check icon placeholder */}
                {isSelected && <Text style={{color: GREEN, fontWeight:'bold'}}>✓</Text>}
              </View>

              {/* Métricas: Subtotal, Viaje, Total */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 25 }}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Productos</Text>
                  <Text style={styles.metricValue}>
                    ${option.subtotal?.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Envío</Text>
                  <Text style={styles.metricValue}>
                    ${option.costo_viaje?.toFixed(0)}
                  </Text>
                  <Text style={styles.metricHint}>
                    {option.distancia?.toFixed(1)} km • {option.duracion?.toFixed(0)} min
                  </Text>
                </View>
                <View style={[styles.metricBox, { borderColor: ORANGE }]}>
                  <Text style={[styles.metricLabel, { color: ORANGE }]}>
                    Total
                  </Text>
                  <Text style={[styles.metricValue, { color: ORANGE }]}>
                    ${option.total?.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* BOTÓN DE SELECCIÓN */}
              {header.estado === 'vigente' || header.estado === 'confirmada' ? (
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    isSelected ? { backgroundColor: "#1f2937", borderWidth: 1, borderColor: GREEN } : { backgroundColor: ORANGE }
                  ]}
                  onPress={() => isSelected ? executeAddToCart(option) : handleSelectOption(option)}
                  disabled={processing}
                >
                  <Text style={[
                    styles.selectButtonText,
                    isSelected && { color: GREEN }
                  ]}>
                    {isSelected ? "Agregar al Carrito" : "Seleccionar esta opción"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        {/* DETALLE DE PRODUCTOS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Productos a cotizar</Text>
          {detalles.length === 0 ? (
            <Text style={styles.subtitle}>Sin líneas registradas.</Text>
          ) : (
            <FlatList
              data={detalles}
              keyExtractor={(_, idx) => `${idx}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => {
                // Buscamos cuál es el precio para la opción que está actualmente seleccionada (o la mejor por defecto)
                // Obtenemos la opción activa basándonos en el ID de ferretería del header
                const activeOption = options.find(o => o.id_ferreteria === header.id_ferreteria_recomendada) || sortedOptions[0];
                
                // Buscamos el precio de este producto dentro de esa opción activa
                const prodInOption = activeOption.productos?.find((p:any) => p.id_producto === item.id_producto);
                
                // Precio a mostrar: el de la opción activa, o el snapshot si falla
                const precioMostrar = prodInOption ? prodInOption.precio : item.precio_unitario_snapshot;

                return (
                  <View style={styles.lineItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineTitle}>
                        {item.nombre_producto_snapshot ?? "Producto"}
                      </Text>
                      <Text style={styles.lineSubtitle}>
                        {/* Mostramos el precio unitario real */}
                        Cant: {item.cantidad ?? 0} • Unit: ${precioMostrar}
                      </Text>
                    </View>
                    <Text style={styles.lineTotal}>
                      {/* Calculamos el total con el precio real */}
                      ${((item.cantidad ?? 0) * (precioMostrar ?? 0)).toFixed(0)}
                    </Text>
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    padding: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  backText: {
    color: "#E5E7EB",
    fontSize: 16,
  },
  topTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    borderColor: "#111827",
    borderWidth: 1,
    marginBottom: 14,
  },
  metricsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderColor: "#1f2937",
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#1f2937",
    color: "#E5E7EB",
    fontSize: 12,
    textTransform: "capitalize",
    overflow: "hidden",
  },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 8,
    backgroundColor: "#0b1220",
    gap: 4,
  },
  metricLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
  },
  metricHint: {
    color: "#6b7280",
    fontSize: 10,
  },
  lineItem: {
    backgroundColor: "#0b1220",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lineTitle: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "700",
  },
  lineSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  lineTotal: {
    color: ORANGE,
    fontSize: 15,
    fontWeight: "700",
  },
  loader: {
    flex: 1,
    backgroundColor: DARK_BG,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loaderText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  sortRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  sortButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sortButtonActive: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },
  sortButtonText: {
    color: "#E5E7EB",
    fontWeight: "600",
    fontSize: 13,
  },
  sortButtonTextActive: {
    color: DARK_BG,
  },
  bestOptionCard: {
    borderColor: ORANGE,
    borderWidth: 1.5,
  },
  savingsBanner: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "center",
  },
  savingsText: {
    color: "#F9FAFB",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  optionTitle: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
  },
  selectButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: DARK_BG,
    fontWeight: '700',
    fontSize: 14,
  }
});
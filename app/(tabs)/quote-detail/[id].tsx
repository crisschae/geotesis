import { useEffect, useState, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { supabase } from "@/lib/supabaseClient";

const DARK_BG = "#0b1220";
const CARD_BG = "#0f172a";
const ORANGE = "#ff8a29";

type CotizacionDetalle = {
  id_producto: string | null;
  nombre_producto_snapshot: string | null;
  cantidad: number | null;
  precio_unitario_snapshot: number | null;
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
  detalle_costos: any;
  ferreteria?: {
    razon_social?: string | null;
    direccion?: string | null;
    telefono?: string | null;
  } | null;
};

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [header, setHeader] = useState<CotizacionHeader | null>(null);
  const [detalles, setDetalles] = useState<CotizacionDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) throw new Error("ID no proporcionado");

        const { data: head, error: hErr } = await supabase
          .from("cotizacion")
          .select(
            `
              id_cotizacion,
              created_at,
              expires_at,
              estado,
              subtotal_productos,
              costo_viaje,
              costo_total,
              distancia_km,
              duracion_min,
              detalle_costos,
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
          .select("id_producto, nombre_producto_snapshot, cantidad, precio_unitario_snapshot")
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
    load();
  }, [id, router]);

  const totals = useMemo(() => {
    if (!header) return { subtotal: 0, viaje: 0, total: 0 };
    const subtotal = header.subtotal_productos ?? 0;
    const viaje = header.costo_viaje ?? 0;
    const total = header.costo_total ?? subtotal + viaje;
    return { subtotal, viaje, total };
  }, [header]);

  const ferreName =
    header?.detalle_costos?.ferreteria ||
    header?.ferreteria?.razon_social ||
    "Ferretería recomendada";

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
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            // Navega siempre a la pestaña de cotizaciones, evitando volver al Home
            router.replace("/(tabs)/quotes");
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Detalle de cotización</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.card}>
          <Text style={[styles.title, { textAlign: "center" }]}>
            Cotización #{header.id_cotizacion.slice(0, 8)}
          </Text>
          <Text style={[styles.subtitle, { textAlign: "center" }]}>
            Creada: {new Date(header.created_at).toLocaleDateString("es-CL")} • Expira:{" "}
            {new Date(header.expires_at).toLocaleDateString("es-CL")}
          </Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, header.estado !== "vigente" && styles.badgeSecondary]}>
              {header.estado}
            </Text>
            <Text style={styles.miniBadge}>Ferretería: {ferreName}</Text>
          </View>
        </View>

        <View style={styles.metricsCard}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Subtotal</Text>
            <Text style={styles.metricValue}>${totals.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Viaje</Text>
            <Text style={styles.metricValue}>${totals.viaje.toFixed(2)}</Text>
            <Text style={styles.metricHint}>
              {header.distancia_km?.toFixed(1) ?? "—"} km • {header.duracion_min?.toFixed(0) ?? "—"}{" "}
              min
            </Text>
          </View>
          <View style={[styles.metricBox, { borderColor: ORANGE }]}>
            <Text style={[styles.metricLabel, { color: ORANGE }]}>Total</Text>
            <Text style={[styles.metricValue, { color: ORANGE }]}>${totals.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Líneas de la cotización</Text>
          {detalles.length === 0 ? (
            <Text style={styles.subtitle}>Sin líneas registradas.</Text>
          ) : (
            <FlatList
              data={detalles}
              keyExtractor={(_, idx) => `${idx}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <View style={styles.lineItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineTitle}>
                      {item.nombre_producto_snapshot ?? "Producto"}
                    </Text>
                    <Text style={styles.lineSubtitle}>
                      Cant.: {item.cantidad ?? 0} • ${item.precio_unitario_snapshot ?? 0}
                    </Text>
                  </View>
                  <Text style={styles.lineTotal}>
                    $
                    {((item.cantidad ?? 0) * (item.precio_unitario_snapshot ?? 0)).toFixed(2)}
                  </Text>
                </View>
              )}
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
    borderColor: "#111827",
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    gap: 10,
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
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#1f2937",
    color: "#E5E7EB",
    fontSize: 12,
    textTransform: "capitalize",
  },
  badgeSecondary: {
    backgroundColor: "#3f3f46",
  },
  miniBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#0b1220",
    color: "#9CA3AF",
    fontSize: 12,
  },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#0b1220",
    gap: 6,
  },
  metricLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  metricHint: {
    color: "#6b7280",
    fontSize: 11,
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
});


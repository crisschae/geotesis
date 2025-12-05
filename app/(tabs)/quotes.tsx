import { supabase } from "@/lib/supabaseClient";
import { useCartStore } from "@/services/cartStore";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DARK_BG = "#111827";
const CARD_BG = "#0f172a";
const ORANGE = "#ff8a29";

type Cotizacion = {
  id_cotizacion: string;
  estado: string;
  total_estimada: number;
  expires_at: string;
  created_at: string;
  subtotal_productos?: number | null;
  costo_viaje?: number | null;
  costo_total?: number | null;
  distancia_km?: number | null;
  duracion_min?: number | null;
  id_ferreteria_recomendada?: string | null;
  detalle_costos?: any;
};

export default function QuotesScreen() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const addToCart = useCartStore((s) => s.addToCart);
  const router = useRouter();

  const fetchCotizaciones = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        throw userErr || new Error("No hay sesión activa");
      }

      const { data: cliente, error: clienteErr } = await supabase
        .from("cliente_app")
        .select("id_cliente")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (clienteErr) throw clienteErr;
      if (!cliente?.id_cliente) throw new Error("No se encontró tu perfil de cliente");

      setClienteId(cliente.id_cliente);

      const { data, error } = await supabase
        .from("cotizacion")
        .select(
          "id_cotizacion, estado, total_estimada, expires_at, created_at, subtotal_productos, costo_viaje, costo_total, distancia_km, duracion_min, id_ferreteria_recomendada, detalle_costos"
        )
        .eq("id_cliente", cliente.id_cliente)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudieron cargar las cotizaciones");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  const handleAddToCart = async (id: string) => {
    try {
      setAddingId(id);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw userErr || new Error("No hay sesión");
      if (!clienteId) throw new Error("No se encontró tu perfil de cliente");

      // Recalcular antes de añadir
      await supabase.rpc("fn_recalculate_cotizacion", { p_id_cotizacion: id });

      const { data: detalles, error } = await supabase
        .from("cotizacion_detalle")
        .select(
          "id_producto, cantidad, precio_unitario_snapshot, nombre_producto_snapshot, producto:id_producto (id_ferreteria, nombre, precio, imagenes)"
        )
        .eq("id_cotizacion", id);

      if (error) throw error;
      if (!detalles || detalles.length === 0) {
        throw new Error("La cotización no tiene líneas para agregar");
      }

      detalles.forEach((d: any) => {
        addToCart({
          id_producto: d.id_producto,
          nombre: d.producto?.nombre ?? d.nombre_producto_snapshot ?? "Producto",
          precio: d.producto?.precio ?? d.precio_unitario_snapshot ?? 0,
          quantity: d.cantidad ?? 1,
          id_ferreteria: d.producto?.id_ferreteria ?? null,
          imagenes: d.producto?.imagenes ?? [],
        } as any);
      });

      Alert.alert("Agregado", "La cotización se agregó al carrito", [
        { text: "Ir al carrito", onPress: () => router.push("/(tabs)/CartScreen") },
        { text: "Seguir viendo" },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo agregar al carrito");
    } finally {
      setAddingId(null);
    }
  };

  const onDelete = async (id: string) => {
    Alert.alert("Eliminar cotización", "¿Seguro que quieres eliminarla?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingId(id);
            const { error } = await supabase
              .from("cotizacion")
              .delete()
              .eq("id_cotizacion", id);
            if (error) throw error;
            fetchCotizaciones();
          } catch (err: any) {
            Alert.alert("Error", err?.message ?? "No se pudo eliminar");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const onDetail = (item: Cotizacion) => {
    router.push(`/quote-detail/${item.id_cotizacion}`);
  };

  const renderItem = ({ item }: { item: Cotizacion }) => {
    const expira = new Date(item.expires_at);
    const vencida = expira.getTime() < Date.now();
    const costoViaje = item.costo_viaje ?? 0;
    const subtotal = item.subtotal_productos ?? item.total_estimada ?? 0;
    const costoTotal = item.costo_total ?? subtotal + costoViaje;
    const ferreName =
      (item.detalle_costos && item.detalle_costos.ferreteria) || "Ferretería recomendada";
    return (
      <View style={styles.card}>
        <View style={[styles.cardHeader, { marginBottom: 6, flexDirection: "column", gap: 6 }]}>
          <Text style={[styles.cardTitle, { fontSize: 18, textAlign: "center" }]}>
            Cotización #{item.id_cotizacion.slice(0, 8)}
          </Text>
          <Text style={[styles.cardSubtitle, { textAlign: "center" }]}>
            Creada: {new Date(item.created_at).toLocaleDateString("es-CL")} • Expira:{" "}
            {expira.toLocaleDateString("es-CL")}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
            <Text style={[styles.badge, vencida && styles.badgeDanger]}>
              {vencida ? "Expirada" : item.estado}
            </Text>
            <Text style={styles.miniBadge}>Ferretería: {ferreName}</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Subtotal</Text>
            <Text style={styles.metricValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Viaje</Text>
            <Text style={styles.metricValue}>${costoViaje.toFixed(2)}</Text>
            <Text style={styles.metricHint}>
              {item.distancia_km?.toFixed(1) ?? "—"} km • {item.duracion_min?.toFixed(0) ?? "—"} min
            </Text>
          </View>
          <View style={[styles.metricBox, { borderColor: ORANGE }]}>
            <Text style={[styles.metricLabel, { color: ORANGE }]}>Total</Text>
            <Text style={[styles.metricValue, { color: ORANGE }]}>${costoTotal.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionGhost, styles.dangerBorder]}
            onPress={() => onDelete(item.id_cotizacion)}
            disabled={deletingId === item.id_cotizacion}
          >
            <Text style={[styles.actionGhostText, styles.dangerText]}>
              {deletingId === item.id_cotizacion ? "Eliminando..." : "Eliminar"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionGhost} onPress={() => onDetail(item)}>
            <Text style={styles.actionGhostText}>Detalle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionPrimary}
            onPress={() => handleAddToCart(item.id_cotizacion)}
            disabled={vencida || addingId === item.id_cotizacion}
          >
            <Text style={styles.actionPrimaryText}>
              {addingId === item.id_cotizacion ? "Agregando..." : "Añadir al carrito"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyTitle}>Sin cotizaciones aún</Text>
      <Text style={styles.emptyText}>
        Guarda tus cotizaciones para compararlas y convertirlas en pedidos cuando estés listo.
      </Text>
      <Text style={styles.emptyTip}>Tip: crea una cotización desde la búsqueda de productos.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cotizaciones</Text>
      <TouchableOpacity style={styles.cta} onPress={() => router.push("/(tabs)/search")}>
        <Text style={styles.ctaText}>Crear cotización</Text>
        <Text style={styles.ctaSub}>Busca productos por nombre y guarda tu cotización</Text>
      </TouchableOpacity>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={ORANGE} size="large" />
          <Text style={styles.subtitle}>Cargando tus cotizaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={cotizaciones}
          keyExtractor={(item) => item.id_cotizacion}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchCotizaciones();
              }}
              tintColor={ORANGE}
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    borderColor: "#111827",
    borderWidth: 1,
    gap: 10,
    // Sombra para separar visualmente
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
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
  badgeDanger: {
    backgroundColor: "#7f1d1d",
    color: "#FECACA",
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#0b1220",
    color: "#9CA3AF",
    fontSize: 11,
  },
  cardSubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 2,
  },
  total: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#0b1220",
    gap: 6,
  },
  metricLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  metricValue: {
    color: "#F9FAFB",
    fontSize: 17,
    fontWeight: "700",
  },
  metricHint: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: -2,
  },
  actionGhost: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionGhostText: {
    color: "#E5E7EB",
    fontWeight: "600",
    fontSize: 14,
  },
  dangerBorder: {
    borderColor: "#7f1d1d",
  },
  dangerText: {
    color: "#fca5a5",
  },
  actionPrimary: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: ORANGE,
    justifyContent: "center",
  },
  actionPrimaryText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 8,
  },
  emptyTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  emptyTip: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "600",
  },
  cta: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    gap: 4,
  },
  ctaText: {
    color: DARK_BG,
    fontSize: 16,
    fontWeight: "700",
  },
  ctaSub: {
    color: "#1f2937",
    fontSize: 13,
    fontWeight: "500",
  },
});
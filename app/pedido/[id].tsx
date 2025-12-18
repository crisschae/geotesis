import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabaseClient";

/* =======================
   🎨 COLORES GEOFERRE
======================= */
const COLORS = {
  primary: "#8B5A2B",
  secondary: "#D2B48C",
  background: "#F5F0E6",
  accent: "#4B3621",
  muted: "#999",
  textDark: "#2E2E2E",
};

/* =======================
   ESTADOS PARA RETIRO
======================= */
const STATUS_FLOW = [
  { key: "pagado", label: "Pago confirmado" },
  { key: "preparando", label: "Preparando pedido" },
  { key: "listo_retiro", label: "Listo para retiro" },
  { key: "retirado", label: "Pedido retirado" },
];

export default function PedidoSeguimiento() {
  const { id } = useLocalSearchParams();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPedido();
  }, []);

  async function cargarPedido() {
    const { data, error } = await supabase
      .from("pedido")
      .select("*")
      .eq("id_pedido", id)
      .single();

    if (!error) {
      setPedido(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.center}>
        <Text>No se pudo cargar el pedido.</Text>
      </View>
    );
  }

  const currentStep = STATUS_FLOW.findIndex(
    (s) => s.key === pedido.estado
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.container}>
        {/* HEADER */}
        <Text style={styles.title}>Seguimiento del pedido</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Código del pedido</Text>
          <Text style={styles.value}>
            #{pedido.id_pedido.slice(0, 8).toUpperCase()}
          </Text>

          <Text style={[styles.label, { marginTop: 12 }]}>
            Modalidad
          </Text>
          <Text style={styles.value}>Retiro en tienda</Text>
        </View>

        {/* PROGRESO */}
        <View style={styles.timeline}>
          {STATUS_FLOW.map((step, index) => {
            const isActive = index <= currentStep;

            return (
              <View key={step.key} style={styles.step}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isActive
                        ? COLORS.primary
                        : "#ddd",
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: isActive
                        ? COLORS.accent
                        : COLORS.muted,
                    },
                  ]}
                >
                  {step.label}
                </Text>

                {index < STATUS_FLOW.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      {
                        backgroundColor: isActive
                          ? COLORS.primary
                          : "#ddd",
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* MENSAJE SEGÚN ESTADO */}
        <View style={styles.card}>
          {pedido.estado === "pagado" && (
            <Text style={styles.info}>
              Tu pago fue confirmado. La ferretería comenzará a
              preparar tu pedido.
            </Text>
          )}

          {pedido.estado === "preparando" && (
            <Text style={styles.info}>
              Tu pedido está siendo preparado. Te avisaremos cuando
              esté listo para retiro.
            </Text>
          )}

          {pedido.estado === "listo_retiro" && (
            <Text style={styles.info}>
              ✅ Tu pedido ya está listo para ser retirado en la
              ferretería.
            </Text>
          )}

          {pedido.estado === "retirado" && (
            <Text style={styles.info}>
              📦 Pedido retirado. Gracias por comprar en GeoFerre.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

/* =======================
   ESTILOS
======================= */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  label: {
    color: COLORS.muted,
    fontSize: 14,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  timeline: {
    marginBottom: 20,
  },
  step: {
    position: "relative",
    paddingLeft: 30,
    marginBottom: 20,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: "absolute",
    left: 0,
    top: 4,
  },
  line: {
    position: "absolute",
    left: 6,
    top: 20,
    width: 2,
    height: 30,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  info: {
    fontSize: 15,
    color: COLORS.textDark,
  },
});

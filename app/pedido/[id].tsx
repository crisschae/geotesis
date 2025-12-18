import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
   ESTADOS (RETIRO)
======================= */
const STATUS_FLOW = [
  { key: "pagado", label: "Pago confirmado" },
  { key: "preparando", label: "Preparando pedido" },
  { key: "listo_retiro", label: "Listo para retiro" },
  { key: "retirado", label: "Pedido retirado" },
];

export default function PedidoSeguimiento() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    if (!id) return;

    cargarPedido();

    const interval = setInterval(() => {
        cargarPedido();
    }, 5000); // cada 5 segundos

    return () => clearInterval(interval);
    }, [id]);

  async function cargarPedido() {
    const { data, error } = await supabase
      .from("pedido")
      .select("*")
      .eq("id_pedido", id)
      .single();

    if (error) {
      console.log("❌ Error cargando pedido:", error);
    } else {
      setPedido(data);
    }

    setLoading(false);
  }

  async function confirmarRetiro() {
    const { error } = await supabase
      .from("pedido")
      .update({
        estado: "retirado",
      })
      .eq("id_pedido", id);

    if (error) {
      Alert.alert("Error", "No se pudo confirmar el retiro");
      return;
    }

    Alert.alert(
      "Retiro confirmado",
      "El pedido fue marcado como retirado correctamente"
    );

    setPedido({
      ...pedido,
      estado: "retirado",
    });
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

        {/* DATOS PEDIDO */}
        <View style={styles.card}>
          <Text style={styles.label}>ID del pedido</Text>
          <Text style={styles.value}>
            #{id.slice(0, 8).toUpperCase()}
          </Text>

          <Text style={[styles.label, { marginTop: 12 }]}>
            Modalidad
          </Text>
          <Text style={styles.value}>Retiro en tienda</Text>
        </View>

        {/* TIMELINE */}
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

        {/* MENSAJE */}
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

        {/* BOTÓN CONFIRMAR RETIRO */}
        {pedido.estado === "listo_retiro" && (
          <View style={{ marginBottom: 40 }}>
            <TouchableOpacity
              onPress={confirmarRetiro}
              style={styles.btn}
            >
              <Text style={styles.btnText}>
                Confirmar retiro
              </Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Confirma solo cuando hayas retirado tu pedido
            </Text>
          </View>
        )}
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
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 8,
  },
});

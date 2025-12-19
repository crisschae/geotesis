import GeoFerreHeader from "@/components/GeoFerreHeader";
import Colors from "@/constants/Colors";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { supabase } from "../../lib/supabaseClient";

const PALETTE = Colors.palette;

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
      <View style={styles.container}>
        <GeoFerreHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
        </View>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.container}>
        <GeoFerreHeader />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No se pudo cargar el pedido.</Text>
        </View>
      </View>
    );
  }

  const currentStep = STATUS_FLOW.findIndex(
    (s) => s.key === pedido.estado
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PALETTE.background }}>
      <GeoFerreHeader />
      <View style={styles.container}>
        <Text style={styles.title}>Seguimiento del pedido</Text>

        <View style={styles.card}>
          <Text style={styles.label}>ID del pedido</Text>
          <Text style={styles.value}>#{id.slice(0, 8).toUpperCase()}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>Modalidad</Text>
          <Text style={styles.value}>Retiro en tienda</Text>
        </View>

        <View style={styles.timeline}>
          {STATUS_FLOW.map((step, index) => {
            const isActive = index <= currentStep;
            return (
              <View key={step.key} style={styles.step}>
                <View
                  style={[
                    styles.circle,
                    { backgroundColor: isActive ? PALETTE.primary : PALETTE.border },
                  ]}
                />

                <Text
                  style={[
                    styles.stepLabel,
                    { color: isActive ? PALETTE.primary : PALETTE.textMuted },
                  ]}
                >
                  {step.label}
                </Text>

                {index < STATUS_FLOW.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      { backgroundColor: isActive ? PALETTE.primary : PALETTE.border },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          {pedido.estado === "pagado" && (
            <Text style={styles.info}>
              Tu pago fue confirmado. La ferretería comenzará a preparar tu pedido.
            </Text>
          )}

          {pedido.estado === "preparando" && (
            <Text style={styles.info}>
              Tu pedido está siendo preparado. Te avisaremos cuando esté listo para retiro.
            </Text>
          )}

          {pedido.estado === "listo_retiro" && (
            <Text style={styles.info}>
              ✅ Tu pedido ya está listo para ser retirado en la ferretería.
            </Text>
          )}

          {pedido.estado === "retirado" && (
            <Text style={styles.info}>📦 Pedido retirado. Gracias por comprar en GeoFerre.</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: PALETTE.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: PALETTE.base,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  label: {
    color: PALETTE.textSoft,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 17,
    fontWeight: "700",
    color: PALETTE.text,
  },
  timeline: {
    marginBottom: 16,
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
    fontWeight: "600",
  },
  info: {
    fontSize: 15,
    color: PALETTE.text,
    lineHeight: 22,
  },
  btn: {
    backgroundColor: PALETTE.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: PALETTE.base,
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    textAlign: "center",
    color: PALETTE.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  emptyTitle: {
    color: PALETTE.text,
    fontSize: 16,
    fontWeight: "700",
  },
});

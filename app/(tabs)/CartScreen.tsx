import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "../../lib/supabaseClient";
import { useCartStore } from "../../services/cartStore";

/* =======================
   🎨 COLORES GEOFERRE
======================= */
const COLORS = {
  primary: "#8B5A2B",
  secondary: "#D2B48C",
  background: "#F5F0E6",
  accent: "#4B3621",
  textDark: "#2E2E2E",
};

export default function CartScreen() {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);

  const [usuario, setUsuario] = useState<any>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);

  // Inputs tarjeta
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvc, setCvc] = useState("");

  const total = cart.reduce(
    (sum, item) => sum + item.precio * (item.quantity ?? 1),
    0
  );

  /* =======================
     OBTENER USUARIO + CLIENTE
  ======================= */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      setUsuario(data.user);

      const { data: cliente, error } = await supabase
        .from("cliente_app")
        .select("id_cliente")
        .eq("auth_user_id", data.user.id)
        .single();

      if (error) {
        console.log("❌ Error cliente_app:", error);
        return;
      }

      setClienteId(cliente.id_cliente);
    });
  }, []);

  /* =======================
     FORMATTERS TARJETA
  ======================= */
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpDate = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  };

  const formatCVC = (text: string) =>
    text.replace(/\D/g, "").slice(0, 4);

  /* =======================
     PAGO AUTOMÁTICO (DEMO)
  ======================= */
  async function ejecutarPago() {
    if (!clienteId) {
      Alert.alert(
        "Error",
        "No se pudo identificar al cliente. Intenta nuevamente."
      );
      return;
    }

    try {
      setLoading(true);

      // Simulación procesamiento
      await new Promise((r) => setTimeout(r, 1200));

      const { data: pedidoInsertado, error } = await supabase
        .from("pedido")
        .insert({
          id_cliente: clienteId,
          id_ferreteria: cart[0].id_ferreteria,
          monto_total: total,
          estado: "pagado",
          gateway: "stripe",
          gateway_ref: `geoferre_${Date.now()}`,
          paid_at: new Date().toISOString(),
        })
        .select("id_pedido")
        .single();

      if (error) {
        console.log("❌ Error creando pedido:", error);
        throw error;
      }

      setShowPagoModal(false);
      clearCart();

      // ✅ REDIRECCIÓN AL SEGUIMIENTO DEL PEDIDO
      router.replace({
        pathname: "/pedido/[id]",
        params: { id: pedidoInsertado.id_pedido },
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }


  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Tu carrito está vacío</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", color: COLORS.accent }}>
          Carrito
        </Text>

        {cart.map((item) => (
          <View
            key={item.id_producto}
            style={{
              backgroundColor: "#fff",
              padding: 14,
              borderRadius: 14,
              marginTop: 12,
              flexDirection: "row",
            }}
          >
            <Image
              source={{ uri: item.imagenes?.[0] }}
              style={{ width: 70, height: 70, borderRadius: 10 }}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontWeight: "600" }}>{item.nombre}</Text>
              <Text>${item.precio}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FOOTER */}
      <View style={{ padding: 20, backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Total: ${total}
        </Text>

        <TouchableOpacity
          onPress={() => setShowPagoModal(true)}
          style={{
            backgroundColor: COLORS.primary,
            padding: 16,
            borderRadius: 16,
            marginTop: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18 }}>
            Pagar
          </Text>
        </TouchableOpacity>
      </View>

      {/* =======================
          MODAL PASARELA
      ======================= */}
      <Modal visible={showPagoModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 22,
                padding: 22,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: COLORS.accent,
                  textAlign: "center",
                }}
              >
                Pago seguro GeoFerre
              </Text>

              <Text
                style={{
                  textAlign: "center",
                  color: "#777",
                  marginBottom: 14,
                }}
              >
                Procesado por Stripe
              </Text>

              <TextInput
                placeholder="Número de tarjeta"
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                style={inputStyle}
              />

              <TextInput
                placeholder="Nombre del titular"
                value={cardName}
                onChangeText={setCardName}
                style={inputStyle}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  placeholder="MM/AA"
                  keyboardType="numeric"
                  value={expDate}
                  onChangeText={(t) => setExpDate(formatExpDate(t))}
                  style={[inputStyle, { flex: 1 }]}
                />
                <TextInput
                  placeholder="CVC"
                  keyboardType="numeric"
                  value={cvc}
                  onChangeText={(t) => setCvc(formatCVC(t))}
                  style={[inputStyle, { flex: 1 }]}
                />
              </View>

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={{ marginTop: 20 }}
                />
              ) : (
                <TouchableOpacity
                  onPress={ejecutarPago}
                  style={{
                    backgroundColor: COLORS.primary,
                    padding: 16,
                    borderRadius: 16,
                    marginTop: 20,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16 }}>
                    Pagar ${total}
                  </Text>
                </TouchableOpacity>
              )}

              <Text
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "#888",
                  marginTop: 10,
                }}
              >
                🔒 Datos protegidos · No se almacenan
              </Text>

              <TouchableOpacity
                onPress={() => setShowPagoModal(false)}
                style={{ marginTop: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#999" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* =======================
   ESTILO INPUT
======================= */
const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 14,
  padding: 14,
  marginTop: 12,
  fontSize: 16,
  backgroundColor: "#fff",
};

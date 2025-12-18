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
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "../../lib/supabaseClient";
import { useCartStore } from "../../services/cartStore";

/* =======================
   🎨 PALETA GEOFERRE
======================= */
const COLORS = {
  primary: "#8B5A2B",
  background: "#F5F0E6",
  card: "#FFFFFF",
  textDark: "#2E2E2E",
  textMuted: "#777",
};

export default function CartScreen() {
  const router = useRouter();
  const { cart, clearCart, incrementQuantity, decreaseQuantity, removeFromCart, } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvc, setCvc] = useState("");



  const total = cart.reduce(
    (sum, item) => sum + item.precio * (item.quantity ?? 1),
    0
  );

  /* =======================
     CLIENTE
  ======================= */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      const { data: cliente } = await supabase
        .from("cliente_app")
        .select("id_cliente")
        .eq("auth_user_id", data.user.id)
        .single();

      setClienteId(cliente?.id_cliente ?? null);
    });
  }, []);

  /* =======================
     FORMATEADORES
  ======================= */
  const formatCardNumber = (t: string) =>
    t.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpDate = (t: string) =>
    t.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d{1,2})$/, "$1/$2");
  const formatCVC = (t: string) => t.replace(/\D/g, "").slice(0, 4);

  /* =======================
     PAGO (DEMO)
  ======================= */
  async function ejecutarPago() {
    if (!clienteId) return Alert.alert("Error", "Cliente no identificado");

    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1200));

      const { data, error } = await supabase
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

      setShowPagoModal(false);
      clearCart();
      if (error || !data) {
        throw new Error("No se pudo crear el pedido");
      }

      router.replace({
        pathname: "/pedido/[id]",
        params: { id: data.id_pedido },
      });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {/* ÍCONO */}
        <View style={styles.emptyIcon}>
          <Text style={{ fontSize: 42 }}>🛒</Text>
        </View>

        {/* TEXTO */}
        <Text style={styles.emptyTitle}>
          Tu carrito está vacío
        </Text>

        <Text style={styles.emptySubtitle}>
          Agrega productos desde ferreterías cercanas
        </Text>

        {/* CTA */}
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.emptyButtonText}>
            Explorar productos
          </Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Tu carrito</Text>

        {cart.map((item) => {
          const qty = item.quantity ?? 1;
          const subtotal = item.precio * qty;

          return (
            <View key={item.id_producto} style={styles.card}>
              <Image
                source={{ uri: item.imagenes?.[0] }}
                style={styles.image}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.nombre}</Text>
                <Text style={styles.unitPrice}>${item.precio} c/u</Text>

                {/* CONTROLES */}
                <View style={styles.controlsRow}>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => decreaseQuantity(item.id_producto)}
                    >
                      <Text style={styles.qtyText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyValue}>{qty}</Text>

                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => incrementQuantity(item.id_producto)}
                    >
                      <Text style={styles.qtyText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeFromCart(item.id_producto)}
                  >
                    <Text style={styles.remove}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.subtotalBox}>
                <Text style={styles.subtotal}>${subtotal}</Text>
              </View>
            </View>
          );
        })}

      </ScrollView>

      {/* CHECKOUT FOOTER */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>${total}</Text>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={() => setShowPagoModal(true)}
        >
          <Text style={styles.payText}>Pagar</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL PAGO */}
      <Modal visible={showPagoModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pago seguro</Text>

            <TextInput
              placeholder="Número de tarjeta"
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={(t) => setCardNumber(formatCardNumber(t))}
              style={styles.input}
            />
            <TextInput
              placeholder="Nombre del titular"
              value={cardName}
              onChangeText={setCardName}
              style={styles.input}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                placeholder="MM/AA"
                keyboardType="numeric"
                value={expDate}
                onChangeText={(t) => setExpDate(formatExpDate(t))}
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                placeholder="CVC"
                keyboardType="numeric"
                value={cvc}
                onChangeText={(t) => setCvc(formatCVC(t))}
                style={[styles.input, { flex: 1 }]}
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
                style={[styles.payButton, { marginTop: 20 }]}
                onPress={ejecutarPago}
              >
                <Text style={styles.payText}>Pagar ${total}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowPagoModal(false)}
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: COLORS.textMuted }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* =======================
   🎨 ESTILOS
======================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: COLORS.textDark,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  image: { width: 64, height: 64, borderRadius: 12 },
  name: { fontWeight: "600", color: COLORS.textDark },
  price: { color: COLORS.primary, marginTop: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
  },
  totalLabel: { color: COLORS.textMuted },
  total: { fontSize: 22, fontWeight: "700" },
  payButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 18,
  },
  payText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  unitPrice: {
  fontSize: 12,
  color: COLORS.textMuted,
  marginTop: 2,
  },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 6,
  },

  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  qtyText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
  },

  qtyValue: {
    width: 28,
    textAlign: "center",
    fontWeight: "600",
  },

  remove: {
    fontSize: 12,
    color: "#B94A48",
  },

  subtotalBox: {
    justifyContent: "center",
    alignItems: "flex-end",
  },

  subtotal: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  emptyContainer: {
  flex: 1,
  backgroundColor: COLORS.background,
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
},

emptyIcon: {
  width: 90,
  height: 90,
  borderRadius: 45,
  backgroundColor: "#fff",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 18,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 4,
},

emptyTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: COLORS.textDark,
  marginBottom: 6,
},

emptySubtitle: {
  fontSize: 14,
  color: COLORS.textMuted,
  textAlign: "center",
  marginBottom: 20,
},

emptyButton: {
  backgroundColor: COLORS.primary,
  paddingVertical: 14,
  paddingHorizontal: 28,
  borderRadius: 18,
},

emptyButtonText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
},


});

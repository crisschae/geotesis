import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { supabase } from "../../lib/supabaseClient";
import { useCartStore } from "../../services/cartStore";

export default function CartScreen() {
  const router = useRouter();
  const {
    cart,
    incrementQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);

  const total = cart.reduce(
    (sum, item) => sum + item.precio * (item.quantity ?? 1),
    0
  );

  /**
   * 🔐 Obtener usuario logueado
   */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  /**
   * 🔁 Retorno desde Stripe (success / cancel)
   */
  useEffect(() => {
    const sub = Linking.addEventListener("url", async ({ url }) => {
      if (url.includes("payment-return")) {
        setShowPago(false);

        if (url.includes("status=success")) {
          await registrarPedidoYPago();
          clearCart();
          Alert.alert("Pago exitoso", "Tu pedido fue registrado correctamente");
          router.replace("/");
        }

        if (url.includes("status=cancel")) {
          Alert.alert("Pago cancelado", "No se realizó el cobro");
        }
      }
    });

    return () => sub.remove();
  }, [cart, usuario]);

  /**
   * 🔐 Protección: usuario debe estar logueado
   */
  async function pagarProtegido() {
    if (!usuario) {
      router.push({
        pathname: "/(auth)/login",
        params: { redirectTo: "CartScreen" },
      });
      return;
    }

    iniciarCheckout();
  }

  /**
   * 🟢 Inicia Stripe Checkout Web
   */
  async function iniciarCheckout() {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/pago/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total }),
        }
      );

      const data = await res.json();
      if (!data?.url) throw new Error("No se recibió URL de pago");

      setCheckoutUrl(data.url);
      setShowPago(true);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "No se pudo iniciar el pago");
    } finally {
      setLoading(false);
    }
  }

  /**
   * 🧾 Guarda pedido + detalle + pago (Supabase)
   */
  async function registrarPedidoYPago() {
    if (!usuario) return;

    // 1️⃣ Pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedido")
      .insert({
        user_id: usuario.id,
        total,
        estado: "pagado",
      })
      .select()
      .single();

    if (pedidoError) {
      console.error(pedidoError);
      return;
    }

    // 2️⃣ Detalle
    const detalle = cart.map((item) => ({
      pedido_id: pedido.id,
      producto_id: item.id_producto,
      cantidad: item.quantity,
      precio_unitario: item.precio,
    }));

    await supabase.from("pedido_detalle").insert(detalle);

    // 3️⃣ Pago
    await supabase.from("pago").insert({
      pedido_id: pedido.id,
      metodo: "stripe_checkout",
      monto: total,
      estado: "completado",
    });
  }

  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Tu carrito está vacío</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
          Carrito ({cart.length})
        </Text>

        {cart.map((item) => (
          <View
            key={item.id_producto}
            style={{
              flexDirection: "row",
              marginBottom: 12,
              backgroundColor: "#fff",
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Image
              source={{ uri: item.imagenes?.[0] }}
              style={{ width: 70, height: 70, borderRadius: 8 }}
            />

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontWeight: "bold" }}>{item.nombre}</Text>
              <Text>${item.precio}</Text>

              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() =>
                    item.quantity === 1
                      ? removeFromCart(item.id_producto)
                      : decreaseQuantity(item.id_producto)
                  }
                >
                  <Text style={{ fontSize: 18 }}>−</Text>
                </TouchableOpacity>

                <Text style={{ marginHorizontal: 10 }}>
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => incrementQuantity(item.id_producto)}
                >
                  <Text style={{ fontSize: 18 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* CTA */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          padding: 20,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Total: ${total}
        </Text>

        <TouchableOpacity
          onPress={pagarProtegido}
          disabled={loading}
          style={{
            marginTop: 12,
            backgroundColor: "#16a34a",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 18 }}>
              Pagar con Stripe
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL STRIPE */}
      <Modal visible={showPago} animationType="slide">
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => setShowPago(false)}
            style={{ padding: 14, backgroundColor: "#111" }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Cerrar pago
            </Text>
          </TouchableOpacity>

          {checkoutUrl && (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={(nav) => {
                if (nav.url.includes("pago-exitoso")) {
                  setShowPago(false);
                  registrarPedidoYPago();
                  clearCart();
                  Alert.alert("Pago exitoso", "Gracias por tu compra");
                  router.replace("/");
                }

                if (nav.url.includes("pago-cancelado")) {
                  setShowPago(false);
                  Alert.alert("Pago cancelado");
                }
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

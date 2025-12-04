import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "../../services/cartStore";
import { useState } from "react";
import { useStripe } from "@stripe/stripe-react-native";
import { createPaymentIntent } from "../../services/stripe";
import { supabase } from "../../lib/supabaseClient";

export default function CartScreen() {
  const router = useRouter();
  const { cart, addToCart, decreaseQuantity, removeFromCart, clearCart } =
    useCartStore();

  const [loading, setLoading] = useState(false);
  const stripe = useStripe();

  const total = cart.reduce(
    (sum, item) => sum + item.precio * (item.quantity ?? 1),
    0
  );

  async function getClienteId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("cliente_app")
      .select("id_cliente")
      .eq("auth_user_id", user.id)
      .single();
    return data?.id_cliente ?? null;
  }

  async function pagarConStripe() {
    try {
      setLoading(true);
      const inicio = await createPaymentIntent(total);
      const paymentIntentId = inicio.paymentIntentId;

      const init = await stripe.initPaymentSheet({
        paymentIntentClientSecret: inicio.clientSecret,
        merchantDisplayName: "GeoFerre",
        returnURL: "geoferre://payment-return",
      });

      if (init.error) throw new Error(init.error.message);

      const present = await stripe.presentPaymentSheet();
      if (present.error) throw new Error(present.error.message);

      const clienteId = await getClienteId();
      const { data: pedido, error: errPedido } = await supabase
        .from("pedido")
        .insert([
          {
            id_ferreteria:
              cart[0].id_ferreteria ??
              cart[0].ferreteria?.id_ferreteria ??
              null,
            id_cliente: clienteId,
            monto_total: total,
            estado: "pendiente",
            gateway: "stripe",
          },
        ])
        .select()
        .single();
      if (errPedido) throw errPedido;

      for (const item of cart) {
        await supabase.from("detalle_pedido").insert([
          {
            id_pedido: pedido.id_pedido,
            id_producto: item.id_producto,
            cantidad: item.quantity ?? 1,
            precio_unitario_venta: item.precio,
          },
        ]);
      }

      await supabase.from("pagos").insert([
        {
          id_pedido: pedido.id_pedido,
          gateway: "stripe",
          gateway_payment_id: paymentIntentId,
          status: "paid",
          raw: present,
        },
      ]);

      await supabase
        .from("pedido")
        .update({
          estado: "pagado",
          gateway_ref: paymentIntentId,
          paid_at: new Date().toISOString(),
        })
        .eq("id_pedido", pedido.id_pedido);

      clearCart();
      Alert.alert("🎉 Pago exitoso", "Gracias por tu compra");
      router.replace("/"); // vuelve al home
    } catch (error: any) {
      console.log("❌ ERROR STRIPE:", error);
      Alert.alert("Error", error.message ?? "No se pudo procesar el pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f8f8" }}>
      <ScrollView style={{ padding: 20, marginTop: 50 }}>
        <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
          Carrito ({cart.length})
        </Text>

        {cart.length === 0 && (
          <Text
            style={{
              fontSize: 18,
              textAlign: "center",
              marginTop: 60,
              color: "#777",
            }}
          >
            Tu carrito está vacío.
          </Text>
        )}

        {cart.map((item) => (
          <View
            key={item.id_producto}
            style={{
              flexDirection: "row",
              backgroundColor: "#fff",
              padding: 12,
              marginVertical: 8,
              borderRadius: 14,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Image
              source={{ uri: item.imagenes?.[0] }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                backgroundColor: "#f3f3f3",
              }}
              resizeMode="contain"
            />

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                {item.nombre}
              </Text>
              <Text style={{ fontSize: 16, marginTop: 4, color: "#444" }}>
                ${item.precio}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    item.quantity === 1
                      ? removeFromCart(item.id_producto)
                      : decreaseQuantity(item.id_producto)
                  }
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#eee",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "bold" }}>−</Text>
                </TouchableOpacity>

                <Text
                  style={{
                    marginHorizontal: 12,
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                >
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => addToCart(item)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#eee",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "bold" }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => removeFromCart(item.id_producto)}
              style={{ padding: 8, justifyContent: "center" }}
            >
              <Text style={{ color: "red", fontWeight: "700", fontSize: 20 }}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {cart.length > 0 && (
        <View
          style={{
            backgroundColor: "#fff",
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "bold" }}>
              Total: ${total}
            </Text>

            {loading && <ActivityIndicator color="#2e7d32" size="small" />}
          </View>

          <TouchableOpacity
            onPress={pagarConStripe}
            disabled={loading}
            style={{
              marginTop: 20,
              backgroundColor: loading ? "#777" : "#2e7d32",
              padding: 16,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              {loading ? "Procesando..." : "Pagar con Stripe"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 10,
              backgroundColor: "#1976d2",
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              Seguir comprando
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

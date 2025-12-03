import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import { useCartStore } from "../../services/cartStore";
import { useState } from "react";

import { useStripe } from "@stripe/stripe-react-native";
import { createPaymentIntent } from "../../services/stripe";

import { supabase } from "../../lib/supabaseClient";

export default function CartScreen() {
  const cart = useCartStore((s) => s.cart);
  const add = useCartStore((s) => s.addToCart);
  console.log("🛒 CARRITO:", JSON.stringify(cart, null, 2));
  const decrease = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeFromCart);
  const clear = useCartStore((s) => s.clearCart);

  const [loading, setLoading] = useState(false);

  const stripe = useStripe();

  // TOTAL
  const total = cart.reduce(
    (sum, item) => sum + item.precio * (item.quantity ?? 1),
    0
  );

  // Obtener cliente según auth (si lo usas)
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

  // 🟦 FUNCIÓN PRINCIPAL DE PAGO
  async function pagarConStripe() {
    try {
      setLoading(true);

      // 1) Crear PaymentIntent en tu backend
      const inicio = await createPaymentIntent(total);
      console.log("🔥 Backend dijo:", inicio);

      // Guardar el paymentIntentId REAL (Stripe NO lo devuelve después)
      const paymentIntentId = inicio.paymentIntentId;

      // 2) Inicializar PaymentSheet
      const init = await stripe.initPaymentSheet({
        paymentIntentClientSecret: inicio.clientSecret,
        merchantDisplayName: "GeoFerre",
        returnURL: "geoferre://payment-return"
      });

      if (init.error) {
        Alert.alert("Error initPaymentSheet", init.error.message);
        return;
      }

      // 3) Mostrar PaymentSheet
      const present = await stripe.presentPaymentSheet();

      if (present.error) {
        Alert.alert("Pago cancelado", present.error.message);
        return;
      }

      console.log("STRIPE RESULT:", present);
      Alert.alert("Pago exitoso 🎉", "Gracias por tu compra");

      // ---------- POST-PAGO EN SUPABASE ----------
      console.log("🔥 Usando paymentIntentId:", paymentIntentId);

      const clienteId = await getClienteId();

      // (B) Crear pedido
      const { data: pedido, error: errPedido } = await supabase
        .from("pedido")
        .insert([
          {
            id_ferreteria: cart[0].id_ferreteria ?? cart[0].ferreteria?.id_ferreteria ?? null,
            id_cliente: clienteId,
            monto_total: total,
            estado: "pendiente",
            gateway: "stripe"
          },
        ])
        .select()
        .single();

      if (errPedido) {
        console.log("❌ Error creando pedido:", errPedido);
        return;
      }

      // (C) Crear detalle_pedido
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

      // (D) Registrar pago
      await supabase.from("pagos").insert([
        {
          id_pedido: pedido.id_pedido,
          gateway: "stripe",
          gateway_payment_id: paymentIntentId,
          status: "paid",
          raw: present,
        },
      ]);

      // (E) Actualizar pedido como pagado
      await supabase
        .from("pedido")
        .update({
          estado: "pagado",
          gateway_ref: paymentIntentId,
          paid_at: new Date().toISOString(),
        })
        .eq("id_pedido", pedido.id_pedido);

      // (F) Limpiar carrito
      clear();
    } catch (error) {
      console.log("❌ ERROR STRIPE:", error);
      Alert.alert("Error", "No se pudo procesar el pago");
    } finally {
      setLoading(false);
    }
  }


  return (
    <ScrollView style={{ padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
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
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 3,
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
            <Text style={{ fontSize: 16, marginTop: 4 }}>
              Precio: ${item.precio}
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
                    ? remove(item.id_producto)
                    : decrease(item.id_producto)
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#e5e5e5",
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
                onPress={() => add(item)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#e5e5e5",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => remove(item.id_producto)}
            style={{ padding: 8, justifyContent: "center" }}
          >
            <Text style={{ color: "red", fontWeight: "700", fontSize: 20 }}>
              X
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {cart.length > 0 && (
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            Total: ${total}
          </Text>

          <TouchableOpacity
            onPress={pagarConStripe}
            style={{
              marginTop: 20,
              backgroundColor: loading ? "#777" : "#2e7d32",
              padding: 16,
              borderRadius: 10,
              alignItems: "center",
            }}
            disabled={loading}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              {loading ? "Procesando..." : "Pagar con Stripe"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

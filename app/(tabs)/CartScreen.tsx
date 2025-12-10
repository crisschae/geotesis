// app/(tabs)/CartScreen.tsx
import { useStripe } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../lib/supabaseClient";
import { useCartStore } from "../../services/cartStore";
import { createPaymentIntent } from "../../services/stripe";

const ACCENT = "#ff8a29";
const DARK_BG = "#111827";
const CARD_BG = "#020617";

type RecommendedProduct = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  tag: string;
  image: string;
};

// Hook para recomendaciones del carrito.
// Más adelante aquí podemos usar Supabase para recomendar productos
// de otras ferreterías según historial, ubicación, etc.
function useCartRecommendations(): RecommendedProduct[] {
  return [
    {
      id: "r1",
      title: "Cemento 25 kg alta resistencia",
      subtitle: "Ideal para radieres y estructuras",
      price: 5490,
      tag: "Oferta",
      image:
        "https://images.pexels.com/photos/5691506/pexels-photo-5691506.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "r2",
      title: "Pack 10 sacos de mezcla lista",
      subtitle: "Para reparaciones rápidas",
      price: 34990,
      tag: "Recomendado",
      image:
        "https://images.pexels.com/photos/5691509/pexels-photo-5691509.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "r3",
      title: "Set herramientas básicas obra",
      subtitle: "Martillo, huincha, alicates",
      price: 18990,
      tag: "Nuevo",
      image:
        "https://images.pexels.com/photos/4792479/pexels-photo-4792479.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ];
}

export default function CartScreen() {
  const router = useRouter();
  const { cart, addToCart, decreaseQuantity, incrementQuantity, removeFromCart, clearCart } =
    useCartStore();

  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const recommended = useCartRecommendations();

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
  async function pagarProtegido() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirige al login y vuelve aquí luego
      router.push({
        pathname: "/(auth)/login",
        params: { redirectTo: "CartScreen" },
      });
      return;
    }

    // Si hay usuario, pagar normal
    pagarConStripe();
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
      Alert.alert(
        "Compra realizada con éxito",
        "Te enviaremos un correo con las instrucciones de retiro de tu pedido."
      );
      router.replace("/"); // vuelve al home
    } catch (error: any) {
      console.log("❌ ERROR STRIPE:", error);
      Alert.alert("Error", error.message ?? "No se pudo procesar el pago");
    } finally {
      setLoading(false);
    }
  }

  // Estado vacío tipo "Mercado Libre" pero con tu estilo
  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: DARK_BG }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Banner superior */}
          <View
            style={{
              backgroundColor: ACCENT,
              borderRadius: 18,
              padding: 18,
              marginTop: 40,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(0,0,0,0.06)",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 14,
              }}
            >
              <Text style={{ fontSize: 32 }}>🛒</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Tu carrito está vacío
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  color: "#1f2937",
                  fontSize: 13,
                }}
              >
                Agrega productos para comparar precios y reservar materiales
                cerca de ti.
              </Text>
            </View>
          </View>

          {/* CTA descubrir productos */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 18,
              alignSelf: "center",
              borderRadius: 999,
              paddingHorizontal: 22,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: ACCENT,
              backgroundColor: CARD_BG,
            }}
          >
            <Text style={{ color: ACCENT, fontWeight: "600", fontSize: 14 }}>
              Descubrir productos
            </Text>
          </TouchableOpacity>

          {/* Recomendaciones */}
          <Text
            style={{
              marginTop: 32,
              marginBottom: 12,
              fontSize: 18,
              fontWeight: "700",
              color: "#F9FAFB",
            }}
          >
            Recomendaciones para ti
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10 }}
          >
            {recommended.map((r) => (
              <View
                key={r.id}
                style={{
                  width: 220,
                  backgroundColor: CARD_BG,
                  borderRadius: 16,
                  marginRight: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#1f2937",
                }}
              >
                <Image
                  source={{ uri: r.image }}
                  style={{ width: "100%", height: 120, backgroundColor: "#111827" }}
                />
                <View style={{ padding: 12 }}>
                  <Text
                    numberOfLines={2}
                    style={{ color: "#F9FAFB", fontWeight: "600", fontSize: 14 }}
                  >
                    {r.title}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}
                  >
                    {r.subtitle}
                  </Text>
                  <Text
                    style={{
                      marginTop: 8,
                      color: "#F9FAFB",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    ${r.price.toLocaleString("es-CL")}
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      color: ACCENT,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {r.tag}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      </View>
    );
  }

  // Estado con productos en el carrito
  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 12,
            color: "#111827",
          }}
        >
          Carrito ({cart.length})
        </Text>

        {cart.map((item) => (
          <View
            key={item.id_producto}
            style={{
              flexDirection: "row",
              backgroundColor: "#fff",
              padding: 12,
              marginVertical: 8,
              borderRadius: 16,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 6,
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
              resizeMode="cover"
            />

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}
              >
                {item.nombre}
              </Text>
              <Text style={{ fontSize: 16, marginTop: 4, color: "#111827" }}>
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
                    backgroundColor: "#f4f4f5",
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
                  onPress={() => incrementQuantity(item.id_producto)} // incrementa 1 fijo, sin duplicar
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#f4f4f5",
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

      {/* Resumen pegado abajo */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
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
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
            Total: ${total}
          </Text>

          {loading && <ActivityIndicator color="#2e7d32" size="small" />}
        </View>

        <TouchableOpacity
          onPress={pagarProtegido}
          disabled={loading}
          style={{
            marginTop: 16,
            backgroundColor: loading ? "#9ca3af" : "#16a34a",
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
            backgroundColor: "#2563eb",
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
    </View>
  );
}

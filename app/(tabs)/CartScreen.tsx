import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useCartStore } from "../../services/cartStore";
import { router } from "expo-router";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";

export default function CartScreen() {
  const cart = useCartStore((s) => s.cart);
  const add = useCartStore((s) => s.addToCart);
  const decrease = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeFromCart);

  // Estado para evitar doble pago
  const [loading, setLoading] = useState(false);

  // Total del carrito
  const total = cart.reduce(
    (sum, item) => sum + item.precio * item.quantity,
    0
  );

  // --- FUNCIÓN PARA INICIAR PAGO ---
  async function iniciarPago() {
    console.log("PASO 1: iniciarPago() fue llamado");

    if (loading) return;
    setLoading(true);

    try {
      console.log("PASO 2: preparando orderId y total");
      const orderId = Date.now().toString();

      console.log("PASO 3: enviando fetch a backend...");
      const response = await fetch("http://192.168.18.3:5000/api/pago/crear", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, total }),
      });

      console.log("PASO 4: fetch respondió, procesando JSON...");
      const data = await response.json();

      console.log("PASO 5: data recibida:", data);

      if (!data.checkoutUrl) {
        console.log("PASO 6: checkoutUrl no existe");
        alert("Error creando la orden de pago");
        setLoading(false);
        return;
      }

      console.log("PASO 7: haciendo router.push:", data.checkoutUrl);
      await WebBrowser.openBrowserAsync(data.checkoutUrl);

    } catch (error) {
      console.log("PASO ERROR:", error);
      alert("No se pudo iniciar el pago");
    }

    console.log("PASO 8: finalizando iniciarPago()");
    setLoading(false);
  }


  return (
    <ScrollView style={{ padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Carrito ({cart.length})
      </Text>

      {/* SI EL CARRITO ESTÁ VACÍO */}
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

      {/* LISTADO DE PRODUCTOS */}
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

            {/* CONTROLES DE CANTIDAD */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              {/* BOTÓN - */}
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

              {/* CANTIDAD */}
              <Text
                style={{
                  marginHorizontal: 12,
                  fontSize: 18,
                  fontWeight: "600",
                }}
              >
                {item.quantity}
              </Text>

              {/* BOTÓN + */}
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

          {/* BOTÓN ELIMINAR */}
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

      {/* TOTAL Y BOTÓN PAGAR */}
      {cart.length > 0 && (
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            Total: ${total}
          </Text>

          <TouchableOpacity
            onPress={iniciarPago}
            style={{
              marginTop: 20,
              backgroundColor: "#2e7d32",
              padding: 16,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              {loading ? "Procesando..." : "Pagar"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

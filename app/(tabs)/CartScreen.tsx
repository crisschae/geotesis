import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useCartStore } from "../../services/cartStore";

export default function CartScreen() {
  const cart = useCartStore((s) => s.cart);
  const add = useCartStore((s) => s.addToCart);
  const decrease = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeFromCart);

  const total = cart.reduce(
    (sum, item) => sum + item.precio * item.quantity,
    0
  );

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
                style={{ marginHorizontal: 12, fontSize: 18, fontWeight: "600" }}
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

      {cart.length > 0 && (
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            Total: ${total}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

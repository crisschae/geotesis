import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function Testing() {

  // 👉 REEMPLAZA ESTOS DOS
  const productoId = "cc954434-cd47-435f-a35a-c2bd122c4ef8";
  const storeId = "445158ab-fed5-4eb4-886f-f99ba0b83082";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zona de Testing 🔧</Text>

      {/* IR A PRODUCTO */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push(`/productos/${productoId}`)}
      >
        <Text style={styles.btnText}>Ir a Producto 🛠️</Text>
      </TouchableOpacity>

      {/* IR A FERRETERÍA */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push(`/ferreteria/${storeId}`)}
      >
        <Text style={styles.btnText}>Ir a Ferretería 🏪</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
  },
  btn: {
    backgroundColor: "#8d6e63",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: 260,
  },
  btnText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
});

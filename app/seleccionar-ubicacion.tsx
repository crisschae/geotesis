import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 📍 Lista de ciudades predeterminadas (puedes agregar más)
const ciudades = [
  { nombre: "Chillán, Ñuble", coords: { latitude: -36.606, longitude: -72.103 } },
  { nombre: "San Carlos, Ñuble", coords: { latitude: -36.424, longitude: -71.959 } },
  { nombre: "Bulnes, Ñuble", coords: { latitude: -36.742, longitude: -72.299 } },
  { nombre: "Quillón, Ñuble", coords: { latitude: -36.739, longitude: -72.470 } },
  { nombre: "Yungay, Ñuble", coords: { latitude: -37.118, longitude: -71.955 } },
  { nombre: "Coihueco, Ñuble", coords: { latitude: -36.638, longitude: -71.825 } },
];

export default function SeleccionarUbicacion() {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const guardar = async () => {
    const ciudad = ciudades.find((c) => c.nombre === seleccion);
    if (!ciudad) return;

    await AsyncStorage.setItem("ciudad", ciudad.nombre);
    await AsyncStorage.setItem("coords", JSON.stringify(ciudad.coords));

    router.back(); // 🔙 vuelve al Home automáticamente
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.title}>Selecciona tu ubicación</Text>
        <Text style={styles.subtitle}>
          Esto ajustará las ferreterías según tu ciudad.
        </Text>
      </View>

      <FlatList
        data={ciudades}
        keyExtractor={(item) => item.nombre}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSeleccion(item.nombre)}
            style={[
              styles.ciudadCard,
              seleccion === item.nombre && styles.ciudadCardActiva,
            ]}
          >
            <Text
              style={[
                styles.ciudadTexto,
                seleccion === item.nombre && styles.ciudadTextoActivo,
              ]}
            >
              {item.nombre}
            </Text>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        disabled={!seleccion}
        onPress={guardar}
        style={[
          styles.botonConfirmar,
          !seleccion && { backgroundColor: "#4b5563" },
        ]}
      >
        <Text style={styles.botonTexto}>Confirmar ubicación</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20,
  },
  title: {
    color: "#E5E7EB",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 6,
  },
  ciudadCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 10,
  },
  ciudadCardActiva: {
    backgroundColor: "#ff8a29",
  },
  ciudadTexto: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "500",
  },
  ciudadTextoActivo: {
    color: "#111827",
    fontWeight: "700",
  },
  botonConfirmar: {
    backgroundColor: "#ff8a29",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  botonTexto: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
  },
});

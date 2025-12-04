import { useState, useRef, useEffect } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "react-native";

import { MapaFerreterias } from "@/components/MapaFerreterias";
import { FerreteriaSheet } from "@/components/FerreteriaSheet";
import type { FerreteriaCercana } from "@/lib/ferreterias";
import { useRouter } from "expo-router";
import { getProductoMasBaratoPorFerreteria } from "@/lib/productos";
import { getProductosCercanos } from "@/lib/productos";

const ORANGE = "#ff8a29";
const DARK_BG = "#111827";
const CARD_BG = "#020617";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"productos" | "ferreterias">("productos");
  const [selectedFerreteria, setSelectedFerreteria] = useState<FerreteriaCercana | null>(null);
  const [nearFerreterias, setNearFerreterias] = useState<FerreteriaCercana[]>([]);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [preciosMin, setPreciosMin] = useState<{ [key: string]: number | null }>({});
  const [ciudad, setCiudad] = useState("Chillán, Ñuble");
  const [manualLocation, setManualLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingRuta, setLoadingRuta] = useState(false);
  const router = useRouter();
  const [productosCercanos, setProductosCercanos] = useState<any[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // 🔹 Cargar ciudad y coordenadas guardadas
  useEffect(() => {
    AsyncStorage.getItem("ciudad").then((c) => c && setCiudad(c));
    AsyncStorage.getItem("coords").then((coords) => {
      if (coords) setManualLocation(JSON.parse(coords));
    });
  }, []);

  // 🔹 Cargar precios mínimos por ferretería
  useEffect(() => {
    const loadPrecios = async () => {
      if (!nearFerreterias || nearFerreterias.length === 0) return;

      const precios: { [key: string]: number | null } = {};
      for (const f of nearFerreterias) {
        if (!f?.id_ferreteria) continue;
        try {
          const prod = await getProductoMasBaratoPorFerreteria(f.id_ferreteria);
          precios[f.id_ferreteria] = typeof prod?.precio === "number" ? prod.precio : null;
        } catch (error) {
          console.error(`Error cargando precio más barato para ${f?.razon_social}:`, error);
          precios[f.id_ferreteria] = null;
        }
      }
      setPreciosMin(precios);
    };
    loadPrecios();
  }, [nearFerreterias]);

  // 🔹 Animar el sheet
  const toggleSheet = () => {
    if (selectedFerreteria) return;
    const next = !isCollapsed;
    setIsCollapsed(next);
    Animated.timing(sheetAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  // 🔹 Modelo híbrido: obtener distancia real desde Google API
  const obtenerTiempoRuta = async (origen: any, destino: any) => {
    try {
      setLoadingRuta(true);
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origen.lat},${origen.lng}&destinations=${destino.lat},${destino.lng}&mode=driving&language=es&key=${GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);
      const elemento = data.rows[0].elements[0];
      return {
        distancia: elemento.distance.text,
        duracion: elemento.duration.text,
      };
    } catch (error) {
      console.error("Error con Google API:", error);
      return null;
    } finally {
      setLoadingRuta(false);
    }
  };
  // 🔹 Cargar productos cercanos según ubicación actual o manual
  useEffect(() => {
    const loadProductos = async () => {
      try {
        if (!manualLocation) return;
        setLoadingProductos(true);

        const productos = await getProductosCercanos(
          manualLocation.latitude,
          manualLocation.longitude,
          10 // Radio en km
        );
        setProductosCercanos(productos);
      } catch (error) {
        console.error("Error cargando productos cercanos:", error);
      } finally {
        setLoadingProductos(false);
      }
    };

    loadProductos();
  }, [manualLocation]);



  return (
    <View style={styles.screen}>
      {/* 📍 Encabezado estilo Facebook */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => router.push("/seleccionar-ubicacion")}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{ciudad}</Text>
          <Text style={styles.dropdown}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* 🗺️ Mapa */}
      <View style={styles.mapContainer}>
        <MapaFerreterias
          onFerreteriaPress={setSelectedFerreteria}
          onFerreteriasChange={setNearFerreterias}
          focusedFerreteria={selectedFerreteria}
          manualLocation={manualLocation}
        />
      </View>

      {/* 🧱 Sheet inferior */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            transform: [
              {
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 180],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={toggleSheet}>
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>
        </TouchableOpacity>

        {/* 🔍 Buscador */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchIconCircle}>
            <Text style={styles.searchIcon}>⌕</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos o ferreterías..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* 🔸 Filtros */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === "productos" && styles.filterPillActive]}
            onPress={() => setFilter("productos")}
          >
            <Text
              style={[styles.filterText, filter === "productos" && styles.filterTextActive]}
            >
              Productos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === "ferreterias" && styles.filterPillActive]}
            onPress={() => setFilter("ferreterias")}
          >
            <Text
              style={[styles.filterText, filter === "ferreterias" && styles.filterTextActive]}
            >
              Ferreterías
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helperTextRow}>
          {filter === "productos" ? (
            <Text style={styles.helperText}>Modo: buscando materiales cercanos</Text>
          ) : (
            <Text style={styles.helperText}>Ferreterías cercanas</Text>
          )}
        </View>

        {/* 🛒 Productos cercanos */}
        {filter === "productos" && (
          <View style={{ flex: 1, marginTop: 8 }}>
            {loadingProductos ? (
              <ActivityIndicator size="large" color="#ff8a29" />
            ) : productosCercanos.length > 0 ? (
              <Animated.FlatList
                data={productosCercanos}
                horizontal
                keyExtractor={(item) => item.id_producto}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 12 }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      backgroundColor: "#1f2937",
                      borderRadius: 14,
                      marginRight: 14,
                      width: 160,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: item.imagenes?.[0] }}
                      style={{ width: "100%", height: 110 }}
                      resizeMode="cover"
                    />
                    <View style={{ padding: 10 }}>
                      <Text
                        numberOfLines={1}
                        style={{ color: "#E5E7EB", fontWeight: "600" }}
                      >
                        {item.nombre}
                      </Text>
                      <Text style={{ color: "#ff8a29", marginTop: 4 }}>
                        ${item.precio}
                      </Text>
                      <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                        {item.ferreteria?.razon_social}
                      </Text>
                    </View>
                  </View>
                )}
              />
            ) : (
              <Text style={{ color: "#9CA3AF", marginLeft: 16 }}>
                No se encontraron productos cercanos.
              </Text>
            )}
          </View>
        )}

        {/* 📜 Lista ferreterías */}
        {filter === "ferreterias" && (
          <View style={{ flex: 1, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => setFilter("productos")}
              activeOpacity={0.8}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, maxHeight: 220 }}>
              <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {nearFerreterias.length === 0 ? (
                  <Text style={styles.helperText}>
                    No hay ferreterías cercanas en este momento.
                  </Text>
                ) : (
                  nearFerreterias.map((f) => (
                    <TouchableOpacity
                      key={f.id_ferreteria}
                      style={styles.ferreteriaItem}
                      activeOpacity={0.8}
                      onPress={() => setSelectedFerreteria(f)}
                    >
                      <View>
                        <Text style={styles.ferreteriaName}>{f.razon_social}</Text>
                        <Text style={styles.ferreteriaAddress}>{f.direccion}</Text>
                      </View>
                      <Text style={styles.ferreteriaDistance}>
                        {f.distancia_km.toFixed(1)} km
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </Animated.ScrollView>
            </View>
          </View>
        )}
      </Animated.View>

      {/* 🧭 Sheet individual con "Ver ruta" */}
      <FerreteriaSheet
        visible={!!selectedFerreteria}
        ferreteria={selectedFerreteria}
        onClose={() => setSelectedFerreteria(null)}
        onVerRuta={async () => {
          if (!selectedFerreteria?.latitud) return;
          const origen = {
            lat: manualLocation?.latitude ?? -36.606,
            lng: manualLocation?.longitude ?? -72.103,
          };
          const destino = {
            lat: selectedFerreteria.latitud,
            lng: selectedFerreteria.longitud,
          };
          const resultado = await obtenerTiempoRuta(origen, destino);
          if (resultado) {
            Alert.alert(
              selectedFerreteria.razon_social,
              `🚗 ${resultado.distancia} • ⏱ ${resultado.duracion}`
            );
          }
        }}
        onVerCatalogo={() => {
          router.push(`/ferreteria/${selectedFerreteria?.id_ferreteria}`);
        }}
      />

      {loadingRuta && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff8a29" />
          <Text style={{ color: "#fff", marginTop: 10 }}>Calculando distancia...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK_BG },
  header: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#222",
    alignItems: "center",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  locationIcon: { fontSize: 14, marginRight: 6, color: "#ff8a29" },
  locationText: { color: "#fff", fontWeight: "600" },
  dropdown: { color: "#9ca3af", marginLeft: 6 },
  mapContainer: { flex: 1.1, overflow: "hidden" },
  bottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#111827",
  },
  searchIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  searchIcon: { color: ORANGE, fontSize: 18, marginTop: -2 },
  searchInput: { flex: 1, color: "#F9FAFB", fontSize: 15 },
  filtersRow: { flexDirection: "row", marginTop: 12, gap: 12 },
  filterPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  filterPillActive: { backgroundColor: ORANGE },
  filterText: { color: "#E5E7EB", fontSize: 14, fontWeight: "500" },
  filterTextActive: { color: "#111827", fontWeight: "700" },
  helperTextRow: { marginTop: 4 },
  helperText: { color: "#9CA3AF", fontSize: 12 },
  sheetHandleWrapper: { alignItems: "center", marginBottom: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#4b5563" },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#ff8a29",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 4,
  },
  backButtonText: { color: "#111827", fontWeight: "700", fontSize: 14 },
  ferreteriaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#374151",
  },
  ferreteriaName: { color: "#F9FAFB", fontSize: 14, fontWeight: "600" },
  ferreteriaAddress: { color: "#9CA3AF", fontSize: 12 },
  ferreteriaDistance: { color: "#E5E7EB", fontSize: 13, fontWeight: "500" },
  loadingOverlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});

// app/(tabs)/index.tsx
import { FerreteriaSheet } from "@/components/FerreteriaSheet";
import { MapaFerreterias } from "@/components/MapaFerreterias";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { FerreteriaCercana } from "@/lib/ferreterias";
import { getProductoMasBaratoPorFerreteria, getProductosCercanos } from "@/lib/productos";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";




const PALETTE = {
  base: "#ffffff",
  primary: "#986132",      // fuerte principal
  secondary: "#9C6535",    // suave
  soft: "#f7f1ea",         // fondos suaves
  text: "#000000",
  textSoft: "#4b3323",
  border: "#edd8c4",
  accentMedium: "rgba(152, 97, 50, 0.18)",
  accentLight: "rgba(152, 97, 50, 0.10)",
};

const ORANGE = PALETTE.primary;
const DARK_BG = PALETTE.base;
const CARD_BG = PALETTE.soft;

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;


export default function HomeScreen() {
  const router = useRouter();
  const loc = useUserLocation(); // ⭐ SOLO UBICACIÓN DEL USUARIO

  // ================
  // ESTADOS
  // ================
  const [searchMode, setSearchMode] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [selectedFerreteria, setSelectedFerreteria] = useState<FerreteriaCercana | null>(null);
  const [nearFerreterias, setNearFerreterias] = useState<FerreteriaCercana[]>([]);
  const [sheetHeight, setSheetHeight] = useState(0);

  const [productosCercanos, setProductosCercanos] = useState<any[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  const [filter, setFilter] = useState<"productos" | "ferreterias">("productos");
  const [preciosMin, setPreciosMin] = useState<{ [key: string]: number | null }>({});

  const [loadingRuta, setLoadingRuta] = useState(false);
  const [query, setQuery] = useState("");
  const [coordsParaRuta, setCoordsParaRuta] = useState<{ lat: number; lng: number } | null>(null);
  const [centerRequest, setCenterRequest] = useState(0);

  // ===========================
  // ANIMACIÓN DE OVERLAY BÚSQUEDA
  // ===========================
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: searchMode ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [searchMode]);

  // ===========================
  // PAN RESPONDER DEL SHEET
  // ===========================
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          sheetAnim.setValue(Math.min(1, gesture.dy / 320));
        } else {
          sheetAnim.setValue(Math.max(0, 1 + gesture.dy / 320));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100) {
          Animated.timing(sheetAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        } else {
          Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // ===========================
  // CARGAR PRECIOS MÍNIMOS POR FERRETERÍA
  // ===========================
  useEffect(() => {
    const loadPrecios = async () => {
      if (!nearFerreterias || nearFerreterias.length === 0) return;

      const precios: { [key: string]: number | null } = {};

      for (const f of nearFerreterias) {
        if (!f?.id_ferreteria) continue;

        try {
          const prod = await getProductoMasBaratoPorFerreteria(f.id_ferreteria);
          precios[f.id_ferreteria] = typeof prod?.precio === "number" ? prod.precio : null;
        } catch {
          precios[f.id_ferreteria] = null;
        }
      }

      setPreciosMin(precios);
    };

    loadPrecios();
  }, [nearFerreterias]);

  // ===========================
  // SHEET ABRIR/CERRAR
  // ===========================
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

  const collapseSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setIsCollapsed(true);
  };

  // ===========================
  // DISTANCIA / DURACIÓN (ALERTA)
  // ===========================
  const obtenerTiempoRuta = async (origen: any, destino: any) => {
    try {
      setLoadingRuta(true);
      const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origen.lat},${origen.lng}&destination=${destino.lat},${destino.lng}&mode=driving&language=es&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        console.log("No route found:", data);
        return null;
      }

      const leg = data.routes[0].legs[0];

      return {
        distancia: leg.distance.text,
        duracion: leg.duration.text,
      };
    } catch (e) {
      console.log("Error Google Directions:", e);
      return null;
    } finally {
      setLoadingRuta(false);
    }
  };
  async function obtenerDistanciaGoogle(origen: any, destino: any) {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origen.lat},${origen.lng}&destination=${destino.lat},${destino.lng}&mode=driving&language=es&key=${GOOGLE_API_KEY}`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (!data.routes || data.routes.length === 0) return null;

    const leg = data.routes[0].legs[0];

    return {
      distancia: leg.distance.text,   // EJ: "2.1 km"
      duracion: leg.duration.text     // EJ: "6 min"
    };
  }


  
  


  // ===========================
  // CARGAR PRODUCTOS CERCANOS (USANDO SOLO UBICACIÓN REAL)
  // ===========================
  useEffect(() => {
    const load = async () => {
      if (!loc.location) return;

      try {
        setLoadingProductos(true);

        const productos = await getProductosCercanos(
          loc.location.latitude,
          loc.location.longitude,
          10 // radio en km
        );

        setProductosCercanos(productos);
      } catch (e) {
        console.log("Error cargando productos cercanos:", e);
      } finally {
        setLoadingProductos(false);
      }
    };

    load();
  }, [loc.location]);

    useEffect(() => {
    if (!coordsParaRuta) return;
    
  }, [coordsParaRuta]);


  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <View style={styles.screen}>

      {/* 📍 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.locationButton}
          activeOpacity={0.85}
          onPress={() => setCenterRequest((n) => n + 1)}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>Mi ubicación</Text>
        </TouchableOpacity>
      </View>

      {/* 🗺️ MAPA */}
      <View style={styles.mapContainer}>
        <MapaFerreterias
          onMapPress={collapseSheet}
          onFerreteriaPress={async (f) => {
            if (!loc.location) return;

            const origen = {
              lat: loc.location.latitude,
              lng: loc.location.longitude,
            };

            const destino = {
              lat: f.latitud,
              lng: f.longitud,
            };

            // 🔥 Obtener distancia real
            const result = await obtenerDistanciaGoogle(origen, destino);

            if (result) {
              f.distancia_google = result.distancia; // EJ: "2.3 km"
              f.duracion_google = result.duracion;   // EJ: "5 min"
            }

            setSelectedFerreteria({ ...f }); // actualiza el estado con los nuevos datos
            collapseSheet();
          }}

          onFerreteriasChange={setNearFerreterias}
          focusedFerreteria={selectedFerreteria}
          coordsParaRuta={coordsParaRuta} 
          centerRequest={centerRequest}
        />
      </View>

      {/* 🟧 BOTTOM SHEET */}
      <Animated.View
        pointerEvents={selectedFerreteria ? "none" : "auto"}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          setSheetHeight(height);
        }}
        
        style={[
          styles.bottomCard,
          {
            transform: [
              {
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, sheetHeight > 0 ? sheetHeight - 105 : 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* 🟦 HANDLE */}
        <TouchableOpacity activeOpacity={0.8} onPress={toggleSheet} {...panResponder.panHandlers}  >
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>
        </TouchableOpacity>

        {/* 🔍 BUSCADOR */}
        <TouchableOpacity style={styles.searchWrapper} onPress={() => setSearchMode(true)}>
          <View style={styles.searchIconCircle}>
            <Text style={styles.searchIcon}>⌕</Text>
          </View>
          <Text style={{ color: "#9CA3AF", fontSize: 15 }}>
            Buscar productos.
          </Text>
        </TouchableOpacity>

        {/* 🎛️ FILTROS */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === "productos" && styles.filterPillActive]}
            onPress={() => setFilter("productos")}
          >
            <Text style={[styles.filterText, filter === "productos" && styles.filterTextActive]}>
              Productos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === "ferreterias" && styles.filterPillActive]}
            onPress={() => setFilter("ferreterias")}
          >
            <Text style={[styles.filterText, filter === "ferreterias" && styles.filterTextActive]}>
              Ferreterías
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔸 SUBTÍTULO */}
        <View style={styles.helperTextRow}>
          {filter === "productos" ? (
            <Text style={styles.helperText}>Materiales cercanos</Text>
          ) : (
            <Text style={styles.helperText}>Ferreterías cercanas</Text>
          )}
        </View>

        {/* 🛒 LISTA DE PRODUCTOS */}
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
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: "/productos/[id]",
                        params: { id: item.id_producto },
                      })
                    }
                    style={{
                      backgroundColor: PALETTE.base,
                      borderRadius: 14,
                      marginRight: 14,
                      width: 160,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: PALETTE.border,
                    }}
                  >
                    <Image
                      source={{ uri: item.imagenes?.[0] }}
                      style={{ width: "100%", height: 110 }}
                      resizeMode="cover"
                    />
                    <View style={{ padding: 10 }}>
                      <Text numberOfLines={1} style={{ color: PALETTE.text, fontWeight: "600" }}>
                        {item.nombre}
                      </Text>
                      <Text style={{ color: ORANGE, marginTop: 4 }}>${item.precio}</Text>
                      <Text style={{ color: PALETTE.textSoft, fontSize: 12 }}>
                        {item.ferreteria?.razon_social}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={{ color: PALETTE.textSoft, marginLeft: 16 }}>
                No se encontraron productos cercanos.
              </Text>
            )}
          </View>
        )}

        {/* 🧱 LISTA DE FERRETERÍAS */}
        {filter === "ferreterias" && (
          <View style={{ flex: 1, marginTop: 8 }}>
            <View style={{ flex: 1, maxHeight: 220 }}>
              <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                nestedScrollEnabled
                scrollEventThrottle={16}
              >
                {nearFerreterias.map((f) => (
                  <TouchableOpacity
                    key={f.id_ferreteria}
                    style={styles.ferreteriaItem}
                    activeOpacity={0.9}
                    onPress={async () => {
                      if (!loc.location || !f) return;

                      const origen = { lat: loc.location.latitude, lng: loc.location.longitude };
                      const destino = { lat: f.latitud, lng: f.longitud };

                      const result = await obtenerDistanciaGoogle(origen, destino);

                      let newFerreteria = { ...f };

                      if (result) {
                        newFerreteria.distancia_google = result.distancia;
                        newFerreteria.duracion_google = result.duracion;
                      }

                      // 🔥 ACTUALIZAR ARRAY COMPLETO
                      setNearFerreterias((prev) =>
                        prev.map((item) =>
                          item.id_ferreteria === newFerreteria.id_ferreteria
                            ? newFerreteria
                            : item
                        )
                      );

                      // 🔥 ACTUALIZAR selectedFerreteria DESPUÉS que nearFerreterias se actualice
                      setTimeout(() => {
                        setSelectedFerreteria(newFerreteria);
                        collapseSheet();
                      }, 0);
                    }}

                  >
                    <View style={styles.ferreteriaInfo}>
                      <Text style={styles.ferreteriaName}>{f.razon_social}</Text>

                      {/* Distancia real con fallback */}
                      <Text style={styles.ferreteriaDistance}>
                        {f.distancia_google ?? `${f.distancia_km.toFixed(1)} km`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  ))
                }
              </Animated.ScrollView>
            </View>
          </View>
        )}
      </Animated.View>

      {/* 🔵 OVERLAY DE BÚSQUEDA */}
      {searchMode && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: DARK_BG,
            padding: 20,
            opacity: fadeAnim,
            zIndex: 999,
          }}
        >
          <TextInput
            autoFocus
            placeholder="Buscar..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              if (query.trim().length > 0) {
                router.push(`/search?query=${query}`);
                setSearchMode(false);
                setQuery("");
              }
            }}
            style={{
              backgroundColor: "#1f2937",
              padding: 12,
              borderRadius: 10,
              color: "#fff",
              fontSize: 16,
            }}
          />

          <TouchableOpacity onPress={() => setSearchMode(false)}>
            <Text style={{ color: ORANGE, fontSize: 16, marginTop: 20, textAlign: "center" }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 🧭 Sheet Individual */}
      <FerreteriaSheet
        visible={!!selectedFerreteria}
        ferreteria={selectedFerreteria}
        onClose={() => setSelectedFerreteria(null)}
        onVerRuta={async () => {
          if (!selectedFerreteria?.latitud || !loc.location) return;

          const origen = {
            lat: loc.location.latitude,
            lng: loc.location.longitude,
          };

          const destino = {
            lat: selectedFerreteria.latitud,
            lng: selectedFerreteria.longitud,
          };

          // 🔥 1. Mostrar distancia REAL del Directions API
          const resultado = await obtenerTiempoRuta(origen, destino);

          if (resultado) {
            Alert.alert(
              selectedFerreteria.razon_social,
              `🚗 ${resultado.distancia} • ⏱ ${resultado.duracion}`
            );
          }

          // 🔥 2. Ordenar al mapa que dibuje la ruta
          setCoordsParaRuta(destino);
        }}

        onVerCatalogo={() => {
          const id = selectedFerreteria?.id_ferreteria;
          setSelectedFerreteria(null);
          if (id) {
            router.push(`/ferreteria/${id}`);
          }
        }}
      />

      {loadingRuta && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={{ color: PALETTE.text, marginTop: 10 }}>Calculando distancia...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK_BG },
  header: {
    backgroundColor: PALETTE.base,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: PALETTE.border,
    alignItems: "center",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.accentLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  locationIcon: { fontSize: 14, marginRight: 6, color: ORANGE },
  locationText: { color: PALETTE.text, fontWeight: "600" },

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
    backgroundColor: PALETTE.base,
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
  filtersRow: { flexDirection: "row", marginTop: 12, gap: 12 },
  filterPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.accentLight,
  },
  filterPillActive: { backgroundColor: ORANGE },
  filterText: { color: PALETTE.text, fontSize: 14, fontWeight: "500" },
  filterTextActive: { color: PALETTE.base, fontWeight: "700" },
  helperTextRow: { marginTop: 4 },
  helperText: { color: PALETTE.textSoft, fontSize: 12 },
  sheetHandleWrapper: { alignItems: "center", marginBottom: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: PALETTE.border },

  ferreteriaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  ferreteriaName: { color: PALETTE.text, fontSize: 14, fontWeight: "600" },
  ferreteriaAddress: { color: PALETTE.textSoft, fontSize: 12 },
  ferreteriaDistance: { color: PALETTE.text, fontSize: 13, fontWeight: "500" },

  loadingOverlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ferreteriaInfo: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 8,
  paddingHorizontal: 4,
},

});

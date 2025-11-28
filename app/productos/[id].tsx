import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions 
} from 'react-native';

import { supabase } from '@/lib/supabaseClient';
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import { useActionSheet } from "@expo/react-native-action-sheet";

// ⚠️ REEMPLAZA POR TU API KEY
const GOOGLE_MAPS_KEY = "AIzaSyBFNHRW4WSjDU2L5goexyVjIlBU-WiugDs";

// Paleta GeoFerre
const ORANGE = '#8d6e63';   // café medio
const DARK_TEXT = '#3e2723'; 
const BG_LIGHT = '#fbe9e7'; 
const CARD_BG = '#ffffff';  // estilo Amazon
const HEADER_BG = '#3e2723';
const HEADER_TEXT = '#fbe9e7';



/* ---------------------------------------------------------
   CACHE DISTANCIA GOOGLE
--------------------------------------------------------- */
const distanceCache = new Map<string, { distance: string; duration: string }>();

async function obtenerDistanciaGoogle(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number
) {
  const cacheKey = `${originLat}-${originLon}-${destLat}-${destLon}`;

  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${originLat},${originLon}&destinations=${destLat},${destLon}&mode=driving&key=${GOOGLE_MAPS_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") return null;

    const el = data.rows[0].elements[0];
    if (el.status !== "OK") return null;

    const result = {
      distance: el.distance.text,
      duration: el.duration.text,
    };

    distanceCache.set(cacheKey, result);
    return result;

  } catch (error) {
    console.log("Distance API error:", error);
    return null;
  }
}

export default function ProductoScreen() {
  const { id } = useLocalSearchParams();
  const { showActionSheetWithOptions } = useActionSheet();

  const [loading, setLoading] = useState(true);
  const [producto, setProducto] = useState<any>(null);
  const [showImage, setShowImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  const screenWidth = Dimensions.get("window").width;

  /* ---------------------------------------------------------
     CARGAR PRODUCTO
  --------------------------------------------------------- */
  const fetchProducto = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('producto')
      .select(`
        id_producto,
        nombre,
        descripcion,
        precio,
        stock,
        sku,
        imagen_url,
        id_categoria,
        ferreteria (
          id_ferreteria,
          razon_social,
          direccion,
          latitud,
          longitud,
          telefono
        ),
        categoria (
          nombre,
          descripcion
        )
      `)
      .eq('id_producto', id)
      .single();

    setProducto(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducto();
  }, [id]);

  /* ---------------------------------------------------------
     DISTANCIA REAL GOOGLE
  --------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      if (!producto?.ferreteria) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      const latUser = loc.coords.latitude;
      const lonUser = loc.coords.longitude;

      const latFerre = Number(producto.ferreteria.latitud);
      const lonFerre = Number(producto.ferreteria.longitud);

      const r = await obtenerDistanciaGoogle(
        latUser,
        lonUser,
        latFerre,
        lonFerre
      );

      if (r) {
        setDistance(r.distance);
        setDuration(r.duration);
      }
    })();
  }, [producto]);

  /* ---------------------------------------------------------
     NAVEGACIÓN PRO (Google / Apple / Waze)
  --------------------------------------------------------- */
  const abrirNavegacionPRO = () => {
    const lat = producto?.ferreteria?.latitud;
    const lng = producto?.ferreteria?.longitud;
    const nombre = encodeURIComponent(producto?.ferreteria?.razon_social || "Destino");

    const apps = ["Google Maps", "Apple Maps", "Waze", "Cancelar"];

    showActionSheetWithOptions(
      {
        options: apps,
        cancelButtonIndex: 3,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
          );
        }

        if (buttonIndex === 1) {
          Linking.openURL(
            `http://maps.apple.com/?daddr=${lat},${lng}&q=${nombre}&dirflg=d`
          );
        }

        if (buttonIndex === 2) {
          Linking.openURL(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`);
        }
      }
    );
  };

  /* ---------------------------------------------------------
     UI LOADING
  --------------------------------------------------------- */
  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );

  if (!producto)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );

  /* ---------------------------------------------------------
     HEADER PRO (Amazon + GeoFerre)
  --------------------------------------------------------- */
  const headerTitle = producto?.nombre || "Producto";

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: headerTitle,
          headerStyle: { backgroundColor: HEADER_BG },
          headerTintColor: HEADER_TEXT,
          headerTitleStyle: { 
            fontWeight: '700', 
            fontSize: 17 
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 10 }}>
              <Text style={{ color: HEADER_TEXT, fontSize: 22 }}>←</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 14, paddingRight: 14 }}>
              <TouchableOpacity>
                <Text style={{ color: HEADER_TEXT, fontSize: 20 }}>❤️</Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={{ color: HEADER_TEXT, fontSize: 20 }}>🔗</Text>
              </TouchableOpacity>
            </View>
          )
        }}
      />

      {/* CONTENIDO */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Galería */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: "100%", height: 300 }}
        >
          {[producto.imagen_url].map((img, i) => (
          <TouchableOpacity
            onPress={() => {
              if (producto?.imagen_url) {
                console.log("👉 Fullscreen image:", producto.imagen_url);
                setSelectedImage(producto.imagen_url);
                setShowImage(true);
              } else {
                console.log("❌ No hay imagen para mostrar");
              }
            }}
          >
            <Image
              source={{ uri: producto.imagen_url || "" }}
              style={{
                width: screenWidth,
                height: 320,
                resizeMode: "contain",
                backgroundColor: "#fff"
              }}
            />
          </TouchableOpacity>


          ))}
        </ScrollView>
          


        {/* Card Producto */}
        <View style={styles.card}>
          <Text style={styles.productName}>{producto.nombre}</Text>

          <Text style={styles.priceText}>
            ${producto.precio?.toLocaleString("es-CL")}
          </Text>

          {distance && (
            <Text style={styles.distanceBadge}>
              📍 {distance} — ⏱ {duration}
            </Text>
          )}

          <Text style={styles.description}>
            {producto.descripcion || "Sin descripción."}
          </Text>

          <Text style={styles.metaText}>Stock: {producto.stock}</Text>
          <Text style={styles.metaText}>SKU: {producto.sku}</Text>
        </View>

        {/* Ferretería */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Disponible en</Text>

          <Text style={styles.ferreteriaName}>
            🏪 {producto.ferreteria.razon_social}
            
          </Text>
          <Text style={styles.sectionTitle}>Ubucación</Text>
          

          {/* Mapa estático */}
          <TouchableOpacity onPress={abrirNavegacionPRO} activeOpacity={0.9}>
            <Image
              source={{
                uri: `https://maps.googleapis.com/maps/api/staticmap?center=${producto.ferreteria.latitud},${producto.ferreteria.longitud}&zoom=16&size=640x300&markers=color:red|${producto.ferreteria.latitud},${producto.ferreteria.longitud}&key=${GOOGLE_MAPS_KEY}`,
              }}
              style={styles.mapImage}
            />
          </TouchableOpacity>

          {/* Botones */}
          <View style={{ gap: 10, marginTop: 15 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push(`/ferreteria/${producto.ferreteria.id_ferreteria}`)
              }
            >
              <Text style={styles.buttonText}>Ver ferretería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#6d4c41" }]}
            >
              <Text style={styles.buttonText}>Reservar producto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>


      {showImage && (
        <View style={styles.fullScreenContainer} pointerEvents="auto">
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowImage(false)}
          >
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>

          <Image
            source={{ uri: selectedImage || "" }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      )}


    </>
  );
}

/* ---------------------------------------------------------
   ESTILOS AMAZON + GEOFERRE
--------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: BG_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: DARK_TEXT, marginTop: 10 },

  errorContainer: {
    flex: 1,
    backgroundColor: BG_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: DARK_TEXT, fontSize: 16 },

  card: {
    backgroundColor: CARD_BG,
    margin: 16,
    padding: 18,
    borderRadius: 12,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  productName: {
    color: DARK_TEXT,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },

  priceText: {
    color: ORANGE,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  distanceBadge: {
    backgroundColor: '#ffccbc',
    color: DARK_TEXT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 14,
    alignSelf: "flex-start",
    borderRadius: 8,
    marginBottom: 10,
  },

  description: {
    color: '#5d4037',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 10,
  },

  metaText: {
    color: '#6d4c41',
    fontSize: 14,
    marginTop: 4,
  },

  sectionTitle: {
    color: DARK_TEXT,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  ferreteriaName: {
    color: DARK_TEXT,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  ferreteriaAddress: {
    color: '#6d4c41',
    marginBottom: 6,
  },

productImage: {
  width: "100%",
  height: undefined,
  aspectRatio: 1.5,  // ancho mayor
  resizeMode: "contain",
  backgroundColor: "#ffffff",
},



  mapImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginTop: 10,

    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 3,
  },

  button: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },

  buttonText: {
    color: BG_LIGHT,
    fontSize: 16,
    fontWeight: "700",
  },
  fullScreenContainer: {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.95)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},

fullScreenImage: {
  width: "100%",
  height: "100%",
},

closeButton: {
  position: "absolute",
  top: 40,
  right: 20,
  zIndex: 1000,
},

closeText: {
  color: "#fff",
  fontSize: 30,
  fontWeight: "bold",
},

});

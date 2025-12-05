import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View, Image, Animated } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from "react-native-maps";

import { useUserLocation } from "@/hooks/useUserLocation";
import { FerreteriaCercana, getFerreteriasCercanas } from "@/lib/ferreterias";



const INITIAL_REGION = {
  latitude: -36.6066616,
  longitude: -72.1033194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type Props = {
  onMapPress?: () => void;
  onFerreteriaPress?: (ferreteria: FerreteriaCercana) => void;
  onFerreteriasChange?: (ferreterias: FerreteriaCercana[]) => void;
  focusedFerreteria?: FerreteriaCercana | null;
};

export function MapaFerreterias({
  onMapPress,
  onFerreteriaPress,
  onFerreteriasChange,
  focusedFerreteria,
}:Props) {
  const loc = useUserLocation();
  const [ferreterias, setFerreterias] = useState<FerreteriaCercana[]>([]);
  const [loadingFerreterias, setLoadingFerreterias] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ➤ Ruta en el mapa
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);


  // 📍 Región inicial: SOLO GPS
  const region = useMemo(() => {
    if (loc.status === "ready" && loc.location) {
      return {
        latitude: loc.location.latitude,
        longitude: loc.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return INITIAL_REGION;
  }, [loc]);

  // ============================================================
  // 🔹 Cargar ferreterías cercanas (radio 15 km)
  // ============================================================
  useEffect(() => {
    const load = async () => {
      if (!loc.location) return;

      try {
        setLoadingFerreterias(true);

        const data = await getFerreteriasCercanas({
          latitud: loc.location.latitude,
          longitud: loc.location.longitude,
          radioKm: 15, // ← RADIO REAL 15 KM
        });

        setFerreterias(data);
        onFerreteriasChange?.(data);
      } catch (e) {
        console.log("Error cargando ferreterías cercanas:", e);
      } finally {
        setLoadingFerreterias(false);
      }
    };

    load();
  }, [loc.status, loc.location]);

  // ============================================================
  // 🔹 Enfocar ferretería seleccionada
  // ============================================================
  useEffect(() => {
    if (!focusedFerreteria || !mapRef.current) return;

    const f = focusedFerreteria;
    const region: Region = {
      latitude: Number(f.latitud),
      longitude: Number(f.longitud),
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    mapRef.current.animateToRegion(region, 350);
  }, [focusedFerreteria]);

  // ============================================================
  // 🔹 Decodificar polyline (Google Directions API)
  // ============================================================
  function decodePolyline(encoded: string) {
    let points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  // ============================================================
  // 🔹 Generar ruta visual
  // ============================================================

    async function generarRuta(dest: { lat: number; lng: number }) {
      if (!loc?.location) return;

      // 1️⃣ Construir la URL correctamente
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${loc.location.latitude},${loc.location.longitude}&destination=${dest.lat},${dest.lng}&mode=driving&language=es&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`;

      console.log("URL Directions:", url);

      try {
        // 2️⃣ Hacer la petición
        const resp = await fetch(url);
        const data = await resp.json();

        console.log("Google Directions Response:", data);

        // 3️⃣ Validar la respuesta
        if (!data.routes || data.routes.length === 0) {
          console.log("❌ No se encontraron rutas en Google Directions:", data);
          return;
        }

        // 4️⃣ Decodificar polyline
        const points = data.routes[0].overview_polyline.points;
        const decoded = decodePolyline(points);

        // 5️⃣ Guardar coordenadas para dibujar la ruta
        setRouteCoords(decoded);

      } catch (error) {
        console.log("❌ Error generando ruta:", error);
      }
    }

  // ============================================================
  // 🔹 RENDER
  // ============================================================
  if (loc.status === "error") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff8a29" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        toolbarEnabled={false}

        // ❌ No mostrar ciudades, POI ni edificios
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}

        onPress={() => {
          Animated.timing(sheetAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
          setIsCollapsed(true);
          onMapPress?.();
        }}
      >
        {/* 🟧 Marcadores de ferreterías */}
        {ferreterias.map((f) => (
          <Marker
            key={f.id_ferreteria}
            coordinate={{
              latitude: Number(f.latitud),
              longitude: Number(f.longitud),
            }}
            title={f.razon_social}
            description={f.direccion ?? "Ferretería local"}
            onPress={(e) => {
              e.stopPropagation();
              onFerreteriaPress?.(f);
              generarRuta({ lat: f.latitud, lng: f.longitud });
            }}
          >
            <Image
              source={require("../assets/images/icon-pin2.png")}
              style={{ width: 43, height: 43 }}
              resizeMode="contain"
            />
          </Marker>
        ))}

        {/* 🛣️ Ruta dibujada */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={5}
            strokeColor="#ff8a29"
          />
        )}
      </MapView>

      {loadingFerreterias && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#ff8a29" />
        </View>
      )}
    </View>
  );
}

// ========================================================
// 🔹 ESTILOS
// ========================================================
const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  map: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});

// components/MapaFerreterias.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";

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
  coordsParaRuta?: { lat: number; lng: number } | null;
  centerRequest?: number;
};

export function MapaFerreterias({
  onMapPress,
  onFerreteriaPress,
  onFerreteriasChange,
  focusedFerreteria,
  coordsParaRuta, 
  centerRequest,
}: Props) {
  const loc = useUserLocation();
  const [ferreterias, setFerreterias] = useState<FerreteriaCercana[]>([]);
  const [loadingFerreterias, setLoadingFerreterias] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

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

  // ⭐ CENTRAR MAPA EN LA UBICACIÓN REAL APENAS LLEGUE EL GPS
  useEffect(() => {
    if (loc.status === "ready" && loc.location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: loc.location.latitude,
          longitude: loc.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600
      );
    }
  }, [loc.status]);


  // ============================================================
  // 🔹 Cargar ferreterías cercanas (radio 15 km)
  // ============================================================
  useEffect(() => {
    const load = async () => {
      if (!loc.location) return;

      try {
        setLoadingFerreterias(true);
        console.log("📍 Buscando ferreterías en:", loc.location);

        const data = await getFerreteriasCercanas({
          latitud: loc.location.latitude,
          longitud: loc.location.longitude,
          radioKm: 15, 
        });

        console.log("✅ Ferreterías encontradas:", data.length);
        // Descomenta esto para ver si las coordenadas vienen como string o número
        // if(data.length > 0) console.log("Ejemplo dato:", data[0]);

        setFerreterias(data);
        onFerreteriasChange?.(data);
      } catch (e) {
        console.log("❌ Error cargando ferreterías cercanas:", e);
      } finally {
        setLoadingFerreterias(false);
      }
    };

    load();
  }, [loc.status, loc.location]);

  // ============================================================
  // 🔹 Centrar al usuario cuando se solicite
  // ============================================================
  useEffect(() => {
    if (!centerRequest) return;
    if (!loc.location || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: loc.location.latitude,
        longitude: loc.location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      350
    );
  }, [centerRequest, loc.location]);

  // ============================================================
  // 🔹 Enfocar ferretería seleccionada
  // ============================================================
  useEffect(() => {
    if (!focusedFerreteria || !mapRef.current) return;

    const f = focusedFerreteria;
    // Aseguramos conversión a Number aquí también
    const lat = Number(f.latitud);
    const lng = Number(f.longitud);

    if (isNaN(lat) || isNaN(lng)) return;

    const region: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    mapRef.current.animateToRegion(region, 350);
  }, [focusedFerreteria]);

  useEffect(() => {
    if (!coordsParaRuta) return;
    generarRuta(coordsParaRuta);
  }, [coordsParaRuta]);


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
      if (!loc?.location || !mapRef.current) return;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${loc.location.latitude},${loc.location.longitude}&destination=${dest.lat},${dest.lng}&mode=driving&language=es&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;

      try {
        const resp = await fetch(url);
        const data = await resp.json();

        if (!data.routes || data.routes.length === 0) {
          console.log("❌ No se encontraron rutas.");
          return;
        }

        const points = data.routes[0].overview_polyline.points;
        const decoded = decodePolyline(points);

        // 1️⃣ Guardar la ruta
        setRouteCoords(decoded);

        // 2️⃣ Ajustar el mapa a TODA la ruta (como Google Maps)
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(decoded, {
            edgePadding: {
              top: 120,
              right: 60,
              bottom: 180, // espacio para bottom sheet
              left: 60,
            },
            animated: true,
          });
        }, 200);

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
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        onPress={() => {
          Animated.timing(sheetAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
          onMapPress?.();
        }}
      >
        {/* 🟧 Marcadores de ferreterías */}
        {ferreterias.map((f) => {
          // 🔥 CORRECCIÓN CLAVE: Convertir a Number explícitamente
          const lat = Number(f.latitud);
          const lng = Number(f.longitud);

          // Si las coordenadas no son válidas, no renderizamos el marcador para evitar crash
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={f.id_ferreteria}
              coordinate={{
                latitude: lat,
                longitude: lng,
              }}
              onPress={() => {
                onFerreteriaPress?.(f);
              }}
            >
              {/* Intentamos cargar la imagen personalizada */}
              <Image
                source={require("../assets/images/icon-pin2.png")}
                style={{ width: 43, height: 43 }}
                resizeMode="contain"
              />
            </Marker>
          );
        })}

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
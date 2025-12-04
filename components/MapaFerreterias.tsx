import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { useUserLocation } from '@/hooks/useUserLocation';
import { FerreteriaCercana, getFerreteriasCercanas } from '@/lib/ferreterias';
import { Image } from "react-native";
import { Animated } from "react-native";



type Props = {
  onMapPress?: () => void;
  onFerreteriaPress?: (ferreteria: FerreteriaCercana) => void;
  onFerreteriasChange?: (ferreterias: FerreteriaCercana[]) => void;
  focusedFerreteria?: FerreteriaCercana | null;
  manualLocation?: { latitude: number; longitude: number } | null; // 🔸 agregado
};

const INITIAL_REGION = {
  latitude: -36.6066616,
  longitude: -72.1033194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function MapaFerreterias({
  onMapPress, 
  onFerreteriaPress,
  onFerreteriasChange,
  focusedFerreteria,
  manualLocation, // 🔸 agregado
}: Props) {
  const loc = useUserLocation();
  const [ferreterias, setFerreterias] = useState<FerreteriaCercana[]>([]);
  const [loadingFerreterias, setLoadingFerreterias] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isCollapsed, setIsCollapsed] = useState(false);


  // 📍 Región inicial basada en ubicación manual o GPS
  const region = useMemo(() => {
    if (manualLocation) {
      return {
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    if (loc.status === 'ready' && loc.location) {
      return {
        latitude: loc.location.latitude,
        longitude: loc.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return INITIAL_REGION;
  }, [loc, manualLocation]);

  // 🔹 Cargar ferreterías cercanas
  useEffect(() => {
    const load = async () => {
      const baseCoords = manualLocation || loc.location;
      if (!baseCoords) return;

      try {
        setLoadingFerreterias(true);
        const data = await getFerreteriasCercanas({
          latitud: baseCoords.latitude,
          longitud: baseCoords.longitude,
          radioKm: 60,
        });
        setFerreterias(data);
        onFerreteriasChange?.(data);
      } catch (e) {
        console.log('Error cargando ferreterías cercanas:', e);
      } finally {
        setLoadingFerreterias(false);
      }
    };
    load();
  }, [loc.status, loc.location, manualLocation]);

  // 🔹 Enfocar ferretería seleccionada
  useEffect(() => {
    if (!focusedFerreteria || !mapRef.current) return;
    const f = focusedFerreteria;
    const region: Region = {
      latitude: Number(f.latitud),
      longitude: Number(f.longitud),
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    mapRef.current.animateToRegion(region, 400);
  }, [focusedFerreteria]);

  if (loc.status === 'error') {
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

        // 🔥 Tocar el mapa vacío → baja el sheet
        onPress={() => {
          Animated.timing(sheetAnim, {
            toValue: 1, // sheet abajo
            duration: 200,
            useNativeDriver: true,
          }).start();
          setIsCollapsed(true);
        }}
      >
        {ferreterias.map((f) => (
          <Marker
            key={f.id_ferreteria}
            coordinate={{
              latitude: Number(f.latitud),
              longitude: Number(f.longitud),
            }}
            title={f.razon_social}
            description={f.direccion ?? "Ferretería local"}

            // 🚫 NO permitir que tocar el marcador ejecute el onPress del mapa
            onPress={(e) => {
              e.stopPropagation();          // 👈 evita colapsar el sheet
              onFerreteriaPress?.(f);       // 👈 mantiene tu lógica original
            }}
          >
            <Image
              source={require("../assets/images/icon-pin2.png")}
              style={{ width: 43, height: 43 }}
              resizeMode="contain"
            />
          </Marker>
        ))}

        {/* 🔸 Muestra marcador si la ubicación es manual */}
        {manualLocation && (
          <Marker
            coordinate={manualLocation}
            title="Ubicación seleccionada"
            pinColor="#ff8a29"
            onPress={(e) => e.stopPropagation()} // ⬅️ evita colapsar el sheet si se toca este marcador
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
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

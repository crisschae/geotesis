import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { useUserLocation } from '@/hooks/useUserLocation';
import { FerreteriaCercana, getFerreteriasCercanas } from '@/lib/ferreterias';

type Props = {
  onFerreteriaPress?: (ferreteria: FerreteriaCercana) => void;
  onFerreteriasChange?: (ferreterias: FerreteriaCercana[]) => void;
  focusedFerreteria?: FerreteriaCercana | null;
};

const INITIAL_REGION = {
  latitude: -36.6066616,
  longitude: -72.1033194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function MapaFerreterias({
  onFerreteriaPress,
  onFerreteriasChange,
  focusedFerreteria,
}: Props) {
  const loc = useUserLocation();
  const [ferreterias, setFerreterias] = useState<FerreteriaCercana[]>([]);
  const [loadingFerreterias, setLoadingFerreterias] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const region = useMemo(() => {
    if (loc.status === 'ready' && loc.location) {
      return {
        latitude: loc.location.latitude,
        longitude: loc.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return INITIAL_REGION;
  }, [loc]);

  useEffect(() => {
    const load = async () => {
      if (loc.status !== 'ready' || !loc.location) return;
      try {
        setLoadingFerreterias(true);
        const data = await getFerreteriasCercanas({
          latitud: loc.location.latitude,
          longitud: loc.location.longitude,
          radioKm: 60, // radio amplio para desarrollo (luego podemos hacerlo configurable)
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
  }, [loc.status, loc.location]);

  // Enfocar ferretería seleccionada desde la lista
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
        showsUserLocation
        initialRegion={region}>
        {ferreterias.map((f) => (
          <Marker
            key={f.id_ferreteria}
            coordinate={{ latitude: Number(f.latitud), longitude: Number(f.longitud) }}
            title={f.razon_social}
            description={f.direccion ?? undefined}
            onPress={() => onFerreteriaPress?.(f)}
            // Pin personalizado: usa un PNG local de assets
            image={require('@/assets/images/pinferre.png')}
          />
        ))}
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



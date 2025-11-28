import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

type UserLocationState =
  | { status: 'idle' | 'requesting'; location: null; error: null }
  | { status: 'ready'; location: { latitude: number; longitude: number }; error: null }
  | { status: 'error'; location: null; error: string };

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    status: 'idle',
    location: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setState((prev) => ({ ...prev, status: 'requesting' }));

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!isMounted) return;
          setState({
            status: 'error',
            location: null,
            error: 'Permiso de ubicación denegado',
          });
          return;
        }

        const { coords } = await Location.getCurrentPositionAsync({});
        if (!isMounted) return;
        setState({
          status: 'ready',
          location: { latitude: coords.latitude, longitude: coords.longitude },
          error: null,
        });
      } catch (e: any) {
        if (!isMounted) return;
        setState({
          status: 'error',
          location: null,
          error: e?.message ?? 'Error al obtener la ubicación',
        });
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}




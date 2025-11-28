const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_API_KEY) {
  console.warn(
    '[GoogleDistance] Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY en el .env, las distancias reales no funcionarán.'
  );
}

export type DistanceResult = {
  distanceKm: number;
  durationMin: number;
};

export async function getDistanceUserToFerreteria(params: {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}): Promise<DistanceResult | null> {
  if (!GOOGLE_API_KEY) return null;

  const origins = `${params.originLat},${params.originLng}`;
  const destinations = `${params.destLat},${params.destLng}`;

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&mode=driving&origins=${encodeURIComponent(
    origins
  )}&destinations=${encodeURIComponent(destinations)}&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.log('[GoogleDistance] HTTP error', res.status);
    return null;
  }

  const json = await res.json();

  try {
    const element = json.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      console.log('[GoogleDistance] Element status', element?.status);
      return null;
    }

    const distanceKm = element.distance.value / 1000; // metros → km
    const durationMin = element.duration.value / 60; // segundos → minutos

    return { distanceKm, durationMin };
  } catch (e) {
    console.log('[GoogleDistance] Parse error', e);
    return null;
  }
}




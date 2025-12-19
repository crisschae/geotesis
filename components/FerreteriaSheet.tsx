import Colors from "@/constants/Colors";
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useRouter } from "expo-router";

const PALETTE = Colors.palette;

import { useUserLocation } from '@/hooks/useUserLocation';
import type { FerreteriaCercana } from '@/lib/ferreterias';
import { getProductoMasBaratoPorFerreteria } from '@/lib/productos';

// Distancia Haversine en km (sin tocar ninguna API)
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // radio de la Tierra en km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

// Modelo híbrido de velocidad según distancia (minutos aproximados)
function estimarTiempoHibrido(distanciaKm: number) {
  let v; // km/h
  if (distanciaKm < 2) v = 25;        // zona urbana lenta
  else if (distanciaKm < 10) v = 40;  // ciudad fluida
  else if (distanciaKm < 30) v = 60;  // interurbano
  else v = 80;                        // ruta
  return Math.round((distanciaKm / v) * 60);
}


type Props = {
  visible: boolean;
  ferreteria: FerreteriaCercana | null;
  onClose: () => void;
  onVerRuta?: () => void;
  onVerCatalogo?: () => void;
};

export function FerreteriaSheet({
  visible,
  ferreteria,
  onClose,
  onVerRuta,
  onVerCatalogo,
}: Props) {
  const loc = useUserLocation();
  const [loading, setLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [precioMin, setPrecioMin] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      if (!visible || !ferreteria) return;
      if (loc.status !== 'ready' || !loc.location) return;

      try {
        setLoading(true);

        // 1) Distancia local (Haversine) como principal


        // si por alguna razón fallara el cálculo, usa la distancia pre-calculada del registro



        // 2) Tiempo estimado (modelo híbrido)

        // 3) Producto más barato (se mantiene igual)
        const prod = await getProductoMasBaratoPorFerreteria(ferreteria.id_ferreteria);
        setPrecioMin(prod ? prod.precio : null);

      } catch (e) {
        console.log('Error cargando datos del bottom sheet:', e);
        // fallback mínimo si algo falla
        if (ferreteria?.distancia_km != null) {
          setDistanceKm(ferreteria.distancia_km);
          setDurationMin(estimarTiempoHibrido(ferreteria.distancia_km));
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible, ferreteria, loc.status, loc.location]);


  if (!ferreteria) return null;

const distanciaTexto =
  ferreteria.distancia_google ??
  `${ferreteria.distancia_km.toFixed(1)} km`;



  const tiempoTexto =
  ferreteria.duracion_google ??
  "Tiempo no disponible";


  const precioTexto =
    precioMin != null
      ? `Desde $${precioMin.toLocaleString('es-CL')}`
      : 'Sin productos con stock';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{ferreteria.razon_social}</Text>
          <Text style={styles.subtitle}>{ferreteria.direccion}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Distancia</Text>
            <Text style={styles.value}>{distanciaTexto}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Tiempo estimado</Text>
            <Text style={styles.value}>{tiempoTexto}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Precio más barato</Text>
            <Text style={styles.value}>{precioTexto}</Text>
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={PALETTE.primary} size="small" />
              <Text style={styles.loadingText}>Calculando datos...</Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                // Cerrar el sheet antes de navegar
                onClose();
                if (onVerCatalogo) {
                  onVerCatalogo();
                  return;
                }
                if (ferreteria?.id_ferreteria) {
                  router.push(`/ferreteria/${ferreteria.id_ferreteria}`);
                } else {
                  console.warn("No hay ID de ferretería disponible");
                }
              }}
            >
              <Text style={styles.secondaryButtonText}>Ver catálogo</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={onVerRuta}
            >
              <Text style={styles.primaryButtonText}>Ver ruta</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  sheet: {
    backgroundColor: PALETTE.base,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: PALETTE.border,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.text,
  },
  subtitle: {
    fontSize: 13,
    color: PALETTE.textSoft,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: PALETTE.textSoft,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.text,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: PALETTE.textSoft,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: PALETTE.primary,
  },
  primaryButtonText: {
    color: PALETTE.base,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: PALETTE.secondary,
    backgroundColor: PALETTE.base,
  },
  secondaryButtonText: {
    color: PALETTE.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

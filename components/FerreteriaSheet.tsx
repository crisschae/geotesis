import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useUserLocation } from '@/hooks/useUserLocation';
import type { FerreteriaCercana } from '@/lib/ferreterias';
import { getProductoMasBaratoPorFerreteria } from '@/lib/productos';
import { getDistanceUserToFerreteria } from '@/services/googleDistance';

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

  useEffect(() => {
    const load = async () => {
      if (!visible || !ferreteria) return;
      if (loc.status !== 'ready' || !loc.location) return;

      try {
        setLoading(true);

        // 1) Distancia y tiempo reales con Google Distance Matrix
        const dist = await getDistanceUserToFerreteria({
          originLat: loc.location.latitude,
          originLng: loc.location.longitude,
          destLat: Number(ferreteria.latitud),
          destLng: Number(ferreteria.longitud),
        });

        if (dist) {
          setDistanceKm(dist.distanceKm);
          setDurationMin(dist.durationMin);
        } else {
          setDistanceKm(ferreteria.distancia_km);
          setDurationMin(null);
        }

        // 2) Producto más barato de la ferretería
        const prod = await getProductoMasBaratoPorFerreteria(ferreteria.id_ferreteria);
        if (prod) {
          setPrecioMin(prod.precio);
        } else {
          setPrecioMin(null);
        }
      } catch (e) {
        console.log('Error cargando datos del bottom sheet:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible, ferreteria, loc.status, loc.location]);

  if (!ferreteria) return null;

  const distanciaTexto =
    distanceKm != null ? `${distanceKm.toFixed(1)} km` : `${ferreteria.distancia_km.toFixed(1)} km`;

  const tiempoTexto =
    durationMin != null ? `${Math.round(durationMin)} min aprox.` : 'Tiempo no disponible';

  const precioTexto =
    precioMin != null ? `Desde $${precioMin.toLocaleString('es-CL')}` : 'Sin productos con stock';

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
              <ActivityIndicator color="#ff8a29" size="small" />
              <Text style={styles.loadingText}>Calculando datos...</Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={onVerCatalogo}>
              <Text style={styles.secondaryButtonText}>Ver catálogo</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.primaryButton]} onPress={onVerRuta}>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#020617',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4b5563',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
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
    color: '#9CA3AF',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#9CA3AF',
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
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#ff8a29',
  },
  primaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
});




import { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MapaFerreterias } from '@/components/MapaFerreterias';
import { FerreteriaSheet } from '@/components/FerreteriaSheet';
import type { FerreteriaCercana } from '@/lib/ferreterias';

const ORANGE = '#ff8a29';
const DARK_BG = '#111827';
const CARD_BG = '#020617';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'productos' | 'ferreterias'>('productos');
  const [selectedFerreteria, setSelectedFerreteria] = useState<FerreteriaCercana | null>(null);
  const [nearFerreterias, setNearFerreterias] = useState<FerreteriaCercana[]>([]);
  const sheetAnim = useRef(new Animated.Value(0)).current; // 0 = expandido, 1 = colapsado
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSheet = () => {
    if (selectedFerreteria) return; // si está abierto el sheet de ferretería, no mover

    const next = !isCollapsed;
    setIsCollapsed(next);
    const target = next ? 1 : 0;

    Animated.timing(sheetAnim, {
      toValue: target,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.screen}>
      {/* Zona superior: mapa */}
      <View style={styles.mapContainer}>
        <MapaFerreterias
          onFerreteriaPress={setSelectedFerreteria}
          onFerreteriasChange={setNearFerreterias}
          focusedFerreteria={selectedFerreteria}
        />
      </View>

      {/* Tarjeta inferior: buscador + filtros (bottom sheet simple) */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            transform: [
              {
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  // 0 = expandido; ~180px abajo = queda visible la barrita justo sobre la toolbar
                  outputRange: [0, 180],
                }),
              },
            ],
          },
        ]}>
        <TouchableOpacity activeOpacity={0.8} onPress={toggleSheet}>
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <View style={styles.searchIconCircle}>
            <Text style={styles.searchIcon}>⌕</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos o ferreterías..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === 'productos' && styles.filterPillActive,
            ]}
            onPress={() => setFilter('productos')}>
            <Text
              style={[
                styles.filterText,
                filter === 'productos' && styles.filterTextActive,
              ]}>
              Productos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === 'ferreterias' && styles.filterPillActive,
            ]}
            onPress={() => setFilter('ferreterias')}>
            <Text
              style={[
                styles.filterText,
                filter === 'ferreterias' && styles.filterTextActive,
              ]}>
              Ferreterías
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helperTextRow}>
          {filter === 'productos' ? (
            <Text style={styles.helperText}>Modo: buscando materiales cercanos</Text>
          ) : (
            <Text style={styles.helperText}>Ferreterías cercanas</Text>
          )}
        </View>

        {filter === 'ferreterias' && (
          <View style={styles.ferreteriasList}>
            {nearFerreterias.length === 0 ? (
              <Text style={styles.helperText}>No hay ferreterías cercanas en este momento.</Text>
            ) : (
              nearFerreterias.map((f) => (
                <TouchableOpacity
                  key={f.id_ferreteria}
                  style={styles.ferreteriaItem}
                  onPress={() => setSelectedFerreteria(f)}>
                  <View>
                    <Text style={styles.ferreteriaName}>{f.razon_social}</Text>
                    <Text style={styles.ferreteriaAddress}>{f.direccion}</Text>
                  </View>
                  <Text style={styles.ferreteriaDistance}>{f.distancia_km.toFixed(1)} km</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </Animated.View>
      <FerreteriaSheet
        visible={!!selectedFerreteria}
        ferreteria={selectedFerreteria}
        onClose={() => setSelectedFerreteria(null)}
        onVerRuta={() => {
          // FASE 6: aquí conectaremos con Directions API y navegación
          console.log('Ver ruta hacia', selectedFerreteria?.razon_social);
        }}
        onVerCatalogo={() => {
          // FASE futura: navegar a pantalla de catálogo por ferretería
          console.log('Ver catálogo de', selectedFerreteria?.razon_social);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  mapContainer: {
    flex: 1.1,
    overflow: 'hidden',
  },
  bottomCard: {
    position: 'absolute',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111827',
  },
  searchIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  searchIcon: {
    color: ORANGE,
    fontSize: 18,
    marginTop: -2,
  },
  searchInput: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 15,
  },
  filtersRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  filterPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  filterPillActive: {
    backgroundColor: ORANGE,
  },
  filterText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  helperTextRow: {
    marginTop: 4,
  },
  helperText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4b5563',
  },
  ferreteriasList: {
    marginTop: 12,
    gap: 8,
  },
  ferreteriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#374151',
  },
  ferreteriaName: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  ferreteriaAddress: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  ferreteriaDistance: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '500',
  },
});

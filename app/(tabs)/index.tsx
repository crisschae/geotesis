import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#ff8a29';
const DARK_BG = '#111827';
const CARD_BG = '#020617';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'productos' | 'ferreterias'>('productos');

  return (
    <View style={styles.screen}>
      {/* Zona superior: mapa (luego se reemplaza por Mapbox) */}
      <View style={styles.mapContainer}>
        {/* TODO: Reemplazar este placeholder por el componente real de Mapbox.
            Ej: <MapboxGL.MapView ...> */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Aquí irá el mapa de Mapbox con las ferreterías cercanas</Text>
        </View>
      </View>

      {/* Tarjeta inferior: buscador + filtros */}
      <View style={styles.bottomCard}>
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
          <Text style={styles.helperText}>
            Modo: {filter === 'productos' ? 'buscando materiales cercanos' : 'buscando ferreterías cercanas'}
          </Text>
        </View>
      </View>
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    color: '#4b5563',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomCard: {
    flex: 1,
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
});

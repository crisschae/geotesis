import { StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar materiales</Text>
      <Text style={styles.subtitle}>
        Encuentra ferreterías cercanas, compara precios y reserva tus productos.
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Ej: cemento, clavos, pintura..."
      />

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Aquí irá el mapa con las ferreterías cercanas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  mapPlaceholder: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

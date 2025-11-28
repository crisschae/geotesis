import { StyleSheet, Text, View } from 'react-native';

export default function QuotesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cotizaciones</Text>
      <Text style={styles.subtitle}>
        Aquí verás tus cotizaciones y pedidos previos para repetir compras rápidamente.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});



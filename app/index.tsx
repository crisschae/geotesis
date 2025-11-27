import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prueba de Productos</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push('/productos/d1497f9b-a8f8-4543-978e-b1a1220e3df4')
        }
      >
        <Text style={styles.btnText}>Ver producto: Pala</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push('/productos/4d5c4181-3f22-4e30-9f2a-1d318385758b')
        }
      >
        <Text style={styles.btnText}>Ver producto: Martillo</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ff8a29',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    color: '#111',
    fontWeight: '700',
  },
});



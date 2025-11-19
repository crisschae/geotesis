import { StyleSheet, TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function ProfileScreen() {
  // TODO: conectar con el perfil real del usuario desde Supabase

  const handleLogout = () => {
    // TODO: implementar cierre de sesión real
    console.log('Cerrar sesión');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Aquí verás tu información de usuario y preferencias.</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.value}>Usuario GeoFerre</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>usuario@ejemplo.com</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
  section: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    color: '#777',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 'auto',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#6d4c41',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

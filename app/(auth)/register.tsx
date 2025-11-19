import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { supabase } from '@/lib/supabaseClient';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu nombre, correo y contraseña.');
      return;
    }

    try {
      setLoading(true);

      // 1) Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        Alert.alert('Error al registrarse', error?.message ?? 'Intenta nuevamente.');
        return;
      }

      // 2) Crear perfil en la tabla cliente_app
      const { error: profileError } = await supabase.from('cliente_app').insert({
        auth_user_id: data.user.id,
        email: email.trim(),
        nombre: name.trim(),
      });

      if (profileError) {
        Alert.alert(
          'Cuenta creada con advertencia',
          'Se creó el usuario, pero hubo un problema guardando el perfil.'
        );
      } else {
        Alert.alert('Cuenta creada', 'Tu cuenta se creó correctamente. Ahora inicia sesión.');
      }

      // No dejar sesión abierta automáticamente: forzar al usuario a iniciar sesión manualmente
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert('Error inesperado', e.message ?? 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Regístrate para encontrar materiales cerca de ti</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Crea una contraseña segura"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
            <Text style={styles.primaryButtonText}>
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLinkText}>Inicia sesión</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const ORANGE = '#ff8a29';
const DARK_BG = '#111827';
const CARD_BG = '#020617';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    color: '#F9FAFB',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    width: '100%',
    gap: 6,
  },
  inputLabel: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  input: {
    width: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F9FAFB',
    backgroundColor: '#020617',
  },
  primaryButton: {
    marginTop: 8,
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
  },
  primaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  footerLinkText: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: '600',
  },
});
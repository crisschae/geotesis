import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    if (!email) {
      Alert.alert('Correo requerido', 'Ingresa el correo asociado a tu cuenta.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://example.com/reset-password', // TODO: configurar URL real
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada para recuperar tu contraseña.');
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
          <Text style={styles.logoText}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa el correo asociado a tu cuenta para recibir un enlace de recuperación.
          </Text>
        </View>

        <View style={styles.form}>
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

          <TouchableOpacity style={styles.primaryButton} onPress={handleRecover} disabled={loading}>
            <Text style={styles.primaryButtonText}>
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLinkText}>Volver al inicio de sesión</Text>
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
    fontSize: 24,
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
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLinkText: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: '600',
  },
});
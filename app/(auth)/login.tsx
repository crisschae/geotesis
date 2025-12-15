import { supabase } from '@/lib/supabaseClient';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { redirectTo } = useLocalSearchParams();


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.session) {
        Alert.alert('Error al iniciar sesión', error?.message ?? 'Revisa tus credenciales.');
        return;
      }
      // Normalizar redirectTo por si viene como string[] o undefined
        const redirect = Array.isArray(redirectTo)
          ? redirectTo[0]
          : redirectTo ?? null;

        if (redirect) {
          if (redirect === "CartScreen") {
            router.replace("/(tabs)/CartScreen");
          } else {
            router.replace("/(tabs)");
          }
        } else {
          router.replace("/(tabs)");
        }


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
          <Image
            source={{ uri: "https://bhlsmetxwtqypdyxcmyk.supabase.co/storage/v1/object/sign/img/1faf1d92--4710-bec3-becdee77a301.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jOTYxYjljOS1mOWZmLTQzZDUtYWIzNS1iOWVmYTI4ODhlOWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWcvMWZhZjFkOTItLTQ3MTAtYmVjMy1iZWNkZWU3N2EzMDEucG5nIiwiaWF0IjoxNzY1ODMzNTI5LCJleHAiOjE3OTczNjk1Mjl9.BNF1ReoPoo-4FAKQAUU8fArupxcR49UdgM-yrW51TKA" }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Encuentra materiales en ferreterías cercanas</Text>
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

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            <Text style={styles.primaryButtonText}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Aún no tienes cuenta?</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLinkText}>Crear una cuenta nueva</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const PALETTE = {
  primary: '#986132',
  secondary: '#9C6535',
  base: '#ffffff',
  soft: '#f7f1ea',
  text: '#000000',
  textSoft: '#4b3323',
  border: '#edd8c4',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: PALETTE.soft,
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
    alignItems: 'center',
  },
  logoImage: {
    width: 180,
    height: 100,
    marginBottom: 8,
  },
  subtitle: { color: PALETTE.textSoft, fontSize: 14 },
  form: {
    gap: 16,
  },
  inputWrapper: {
    width: '100%',
    gap: 6,
  },
  inputLabel: { color: PALETTE.textSoft, fontSize: 13 },
  input: {
    width: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.secondary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: PALETTE.text,
    backgroundColor: PALETTE.base,
  },
  primaryButton: {
    marginTop: 8,
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
  },
  primaryButtonText: {
    color: PALETTE.base,
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    marginTop: 12,
    fontSize: 13,
    color: PALETTE.primary,
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: { color: PALETTE.textSoft, fontSize: 13 },
  footerLinkText: {
    color: PALETTE.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
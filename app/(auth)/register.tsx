import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';

import { supabase } from '@/lib/supabaseClient';
import type { TipoCombustible } from '@/lib/types';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tipoCombustible, setTipoCombustible] = useState<TipoCombustible | null>(null);
  const [rendimiento, setRendimiento] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !tipoCombustible || !rendimiento) {
      Alert.alert(
        'Campos incompletos',
        'Ingresa tu nombre, correo, contraseña, tipo de combustible y rendimiento.'
      );
      return;
    }

    try {
      setLoading(true);

      const emailTrim = email.trim();
      const nameTrim = name.trim();
      const rendimientoNum = Number.parseFloat(rendimiento.replace(',', '.'));

      if (!Number.isFinite(rendimientoNum) || rendimientoNum <= 0) {
        Alert.alert('Rendimiento inválido', 'Ingresa un rendimiento en km/L mayor que 0.');
        return;
      }

      // 0) Obtener ubicación actual del usuario
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de ubicación denegado',
          'Necesitamos tu ubicación para calcular distancias y recomendaciones.'
        );
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({});
      const lat = currentPosition.coords.latitude;
      const lng = currentPosition.coords.longitude;

      // 1) Crear usuario en Supabase Auth (o reutilizar si ya existe)
      let user =
        null as NonNullable<
          Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']
        > | null;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailTrim,
        password,
      });

      if (signUpError) {
        // Si el usuario ya existe en Auth, intentamos signIn y seguimos flujo de creación de perfiles
        const message = signUpError.message?.toLowerCase() ?? '';
        const alreadyExists =
          message.includes('already registered') ||
          message.includes('user already exists') ||
          signUpError.status === 400;

        if (!alreadyExists) {
          Alert.alert('Error al registrarse', signUpError.message ?? 'Intenta nuevamente.');
          return;
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailTrim,
          password,
        });

        if (signInError || !signInData.user) {
          Alert.alert(
            'Correo ya registrado',
            'Este correo ya tiene una cuenta. Si no recuerdas la contraseña, usa la opción "Olvidé mi contraseña".'
          );
          return;
        }

        user = signInData.user;
      } else {
        user = signUpData.user;
      }

      if (!user) {
        Alert.alert('Error al registrarse', 'No se pudo obtener la información del usuario.');
        return;
      }

      // 2) Crear/actualizar perfil en tabla usuario (solo rol / datos generales para portal)
      const { data: usuarioExistente } = await supabase
        .from('usuario')
        .select('id_usuario, rol')
        .eq('id_usuario', user.id)
        .maybeSingle();

      let nuevoRol = 'cliente';
      if (usuarioExistente?.rol === 'ferreteria') {
        nuevoRol = 'ambos';
      } else if (usuarioExistente?.rol === 'cliente' || usuarioExistente?.rol === 'ambos') {
        nuevoRol = usuarioExistente.rol;
      }

      if (!usuarioExistente) {
        const { error: usuarioError } = await supabase.from('usuario').insert({
          id_usuario: user.id,
          nombre: nameTrim,
          email: emailTrim,
          rol: nuevoRol,
        });

        if (usuarioError) {
          console.log('Error insertando en usuario:', usuarioError);
          Alert.alert(
            'Cuenta creada con advertencia (usuario)',
            usuarioError.message ??
              'Se creó el usuario en Auth, pero hubo un problema guardando el perfil principal.'
          );
        }
      } else if (usuarioExistente && usuarioExistente.rol !== nuevoRol) {
        const { error: usuarioUpdateError } = await supabase
          .from('usuario')
          .update({ rol: nuevoRol })
          .eq('id_usuario', user.id);

        if (usuarioUpdateError) {
          console.log('Error actualizando rol en usuario:', usuarioUpdateError);
          Alert.alert(
            'Advertencia (rol de usuario)',
            usuarioUpdateError.message ??
              'No se pudo actualizar el rol del usuario, pero la cuenta sigue siendo válida.'
          );
        }
      }

      // 3) Crear/actualizar perfil en la tabla cliente_app (datos móviles)
      const { error: profileError } = await supabase
        .from('cliente_app')
        .upsert(
          {
            auth_user_id: user.id,
            email: emailTrim,
            nombre: nameTrim,
            tipo_combustible: tipoCombustible,
            rendimiento_km_l: rendimientoNum,
            latitud: lat,
            longitud: lng,
          },
          { onConflict: 'auth_user_id' }
        );

      if (profileError) {
        console.log('Error en cliente_app upsert:', profileError);
        Alert.alert(
          'Cuenta creada con advertencia (cliente)',
          profileError.message ??
            'Se creó el usuario, pero hubo un problema guardando el perfil de cliente.'
        );
      } else {
        Alert.alert(
          'Cuenta lista',
          'Tu cuenta está configurada correctamente. Ahora inicia sesión para continuar.'
        );
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
            <Text style={styles.inputLabel}>Tipo de combustible</Text>
            <View style={styles.fuelRow}>
              {(['93', '95', '97', 'diesel'] as TipoCombustible[]).map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.fuelChip,
                    tipoCombustible === tipo && styles.fuelChipActive,
                  ]}
                  onPress={() => setTipoCombustible(tipo)}>
                  <Text
                    style={[
                      styles.fuelChipText,
                      tipoCombustible === tipo && styles.fuelChipTextActive,
                    ]}>
                    {tipo === 'diesel' ? 'Diésel' : tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Rendimiento (km/L)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 12"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={rendimiento}
              onChangeText={setRendimiento}
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
  fuelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fuelChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: '#020617',
  },
  fuelChipActive: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },
  fuelChipText: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  fuelChipTextActive: {
    color: '#111827',
    fontWeight: '600',
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
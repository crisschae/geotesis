import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';

async function goNormalFlow() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    router.replace('/(tabs)');
  } else {
    router.replace('/(auth)/login');
  }
}

export default function InitialRoute() {
  // 🔥 DEV MODE: NO redirige automáticamente
  if (__DEV__) {
    return (
      <View style={[styles.container, { gap: 16 }]}>
        <Text style={styles.title}>Portal Dev 🔧</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/testing')}
        >
          <Text style={styles.btnText}>Ir a /testing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnGhost]}
          onPress={goNormalFlow}
        >
          <Text style={[styles.btnText, styles.btnGhostText]}>
            Entrar al flujo normal
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🔥 PRODUCCIÓN: aquí sí redirige automáticamente
  useEffect(() => {
    goNormalFlow();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5E3C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5EDE2' },
  title: { color: '#3e2723', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  btn: { backgroundColor: '#8d6e63', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, minWidth: 220, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#8d6e63' },
  btnGhostText: { color: '#8d6e63' },
});

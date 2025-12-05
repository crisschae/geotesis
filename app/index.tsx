import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';

async function goNormalFlow() {
  const { data: { session } } = await supabase.auth.getSession();

  // Si hay sesión → va al home
  if (session) {
    router.replace('/(tabs)');
  } else {
    // Si no hay sesión → igual puede entrar al home
    router.replace('/(tabs)');
  }
}

export default function InitialRoute() {
  useEffect(() => {
    goNormalFlow();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff8a29" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#111827' 
  },
});

import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabaseClient';

export default function InitialRoute() {
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    };

    checkSession();
  }, []);

  // Pantalla de carga muy simple mientras decidimos a dónde ir
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5E3C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5EDE2',
  },
});




import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function IntroScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación suave de entrada
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulso suave y continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Después de 3s, ir al home (tabs) sin forzar login
    const timeout = setTimeout(async () => {
      router.replace("/(tabs)");
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Glow de fondo */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View style={[styles.logoBox, { opacity: fade, transform: [{ scale }] }]}>
        <Text style={styles.brand}>GeoFerre</Text>
        <Text style={styles.tagline}>Marketplace Ferretero Local</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const PALETTE = Colors.palette;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.base,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(55, 65, 81, 0.18)", // primary con opacidad
    shadowColor: "#374151",
    shadowOpacity: 0.35,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 18 },
    elevation: 18,
  },
  logoBox: {
    paddingVertical: 46,
    paddingHorizontal: 72,
    borderRadius: 26,
    backgroundColor: PALETTE.soft,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
    alignItems: "center",
    gap: 12,
  },
  brand: {
    fontSize: 38,
    fontWeight: "900",
    color: "#374151", // solicitado
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: PALETTE.textSoft,
    letterSpacing: 0.4,
  },
});


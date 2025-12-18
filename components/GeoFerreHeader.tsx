// components/GeoFerreHeader.tsx
import { SafeAreaView, View, Text, StyleSheet, Image } from "react-native";

const PALETTE = {
  primary: "#986132",
  secondary: "#9C6535",
  base: "#ffffff",
  muted: "#6b6b6b",
};

export default function GeoFerreHeader() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/ferre.png")}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
          />
        </View>

        {/* TEXTO */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>GeoFerre</Text>
          <Text style={styles.subtitle}>Marketplace Ferretero Local</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: PALETTE.base,
  },
  container: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#f4eee9",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flexDirection: "column",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: PALETTE.primary,
  },
  subtitle: {
    fontSize: 11,
    color: PALETTE.muted,
    marginTop: -2,
  },
});
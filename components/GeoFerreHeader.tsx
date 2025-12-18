import { View, Text, StyleSheet, Image } from "react-native";

const PALETTE = {
  primary: "#986132",
  secondary: "#9C6535",
  base: "#ffffff",
  muted: "#6b6b6b",
};

export default function GeoFerreHeader() {
  return (
    <View style={styles.container}>
      {/* LOGO (puedes cambiar por imagen cuando quieras) */}
      <View style={styles.logoContainer}>
        <Image
            source={require("../assets/images/ferre.png")}
            style={{ width: 35, height: 35 }}
            />

      </View>

      {/* TEXTO */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>GeoFerre</Text>
        <Text style={styles.subtitle}>Marketplace ferretero local</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  /* LOGO */
  logoContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#f4eee9",
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: 18,
  },

  /* TEXTO */
  textContainer: {
    flexDirection: "column",
    lineHeight: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: PALETTE.primary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    color: PALETTE.muted,
    marginTop: -2,
  },
});

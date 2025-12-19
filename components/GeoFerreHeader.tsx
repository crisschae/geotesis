// components/GeoFerreHeader.tsx
import Colors from "@/constants/Colors";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";

const PALETTE = Colors.palette;

export default function GeoFerreHeader() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/ferre.png")}
            style={{ width: 48, height: 48 }}
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
    width: "100%",
  },
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: PALETTE.base,
  },
  logoContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: PALETTE.base,
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
    color: PALETTE.textSoft,
    marginTop: -2,
  },
});
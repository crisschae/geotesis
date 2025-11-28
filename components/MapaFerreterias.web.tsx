import { View, Text } from "react-native";

export default function MapViewMock() {
  return (
    <View
      style={{
        height: 220,
        backgroundColor: "#1f2937",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        marginVertical: 10,
      }}
    >
      <Text style={{ color: "#f3f4f6" }}>
        🧭 El mapa no está disponible en Web.
      </Text>
    </View>
  );
}

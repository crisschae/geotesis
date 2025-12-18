import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

const PALETTE = {
  primary: "#986132",
  secondary: "#9C6535",
  base: "#ffffff",
  border: "#edd8c4",
  inactive: "#9C6535",
};

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: PALETTE.primary,
          tabBarInactiveTintColor: PALETTE.inactive,
          tabBarStyle: {
            backgroundColor: PALETTE.base,
            borderTopColor: PALETTE.border,
            height: 68,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
          },
          headerShown: useClientOnlyValue(false, true),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="home" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            title: "Buscar",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="search" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="CartScreen"
          options={{
            title: "Mi Carrito",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="shopping-cart" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="quotes"
          options={{
            title: "Cotizaciones",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="list-alt" color={color} />
            ),
          }}
        />

        {/* Pantallas ocultas del tab */}
        <Tabs.Screen
          name="quote-detail/[id]"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="two"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="user-circle" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

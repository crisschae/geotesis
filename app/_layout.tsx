// ========================================
// 1. _layout.tsx (ROOT) - ELIMINAR header global
// ========================================
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { useColorScheme } from '../hooks/useColorScheme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Iniciamos en la intro para mostrar animación de entrada
  initialRouteName: 'intro',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ActionSheetProvider>
        <Stack
          screenOptions={{
            // 🔥 SIN HEADER GLOBAL - cada grupo controla el suyo
            headerShown: false,
          }}
        >
          <Stack.Screen name="intro" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          
          {/* Tabs controlan su propio header */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Modal con header personalizado si lo necesitas */}
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal',
              headerShown: true, // Solo si quieres header en modal
            }} 
          />
        </Stack>
      </ActionSheetProvider>
    </ThemeProvider>
  );
}
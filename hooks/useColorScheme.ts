import { useColorScheme as _useColorScheme } from 'react-native';

/**
 * Hook wrapper por compatibilidad con expo-router
 */
export function useColorScheme() {
  return _useColorScheme() ?? 'light';
}

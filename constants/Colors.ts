// Paleta minimalista gris (tomada de app/(tabs)/search.tsx)
const palette = {
  // Fondos
  base: "#ffffff",
  soft: "#F9FAFB",
  background: "#F3F4F6",

  // Principales
  primary: "#374151",
  primaryHover: "#37291fff",
  secondary: "#6B7280",

  // Textos
  text: "#111827",
  textSoft: "#6B7280",
  textMuted: "#9CA3AF",
  textLight: "#D1D5DB",

  // Bordes y divisores
  border: "#E5E7EB",
  borderDark: "#D1D5DB",
  divider: "#F3F4F6",

  // Acentos
  accentLight: "rgba(55, 65, 81, 0.05)",
  accentMedium: "rgba(55, 65, 81, 0.10)",
  accentStrong: "rgba(55, 65, 81, 0.15)",

  // Estados
  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Sombras
  shadow: "rgba(0, 0, 0, 0.05)",
  shadowMedium: "rgba(0, 0, 0, 0.1)",
  shadowStrong: "rgba(0, 0, 0, 0.15)",

  // Alias de compatibilidad
  card: "#ffffff",
  textDark: "#111827",
};

export default {
  light: {
    text: palette.text,
    background: palette.background,
    tint: palette.primary,
    tabIconDefault: palette.secondary,
    tabIconSelected: palette.primary,
  },
  dark: {
    text: palette.text,
    background: palette.background,
    tint: palette.primary,
    tabIconDefault: palette.secondary,
    tabIconSelected: palette.primary,
  },
  palette,
};

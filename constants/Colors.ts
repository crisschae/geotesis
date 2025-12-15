// Paleta principal GeoFerre: café + crema
const palette = {
  primary: '#986132',
  secondary: '#9C6535',
  base: '#ffffff',
  text: '#000000',
  textSoft: '#4b3323',
  border: '#edd8c4',
};

export default {
  light: {
    text: palette.text,
    background: palette.base,
    tint: palette.primary,
    tabIconDefault: palette.secondary,
    tabIconSelected: palette.primary,
  },
  dark: {
    text: palette.text,
    background: palette.base,
    tint: palette.primary,
    tabIconDefault: palette.secondary,
    tabIconSelected: palette.primary,
  },
  palette,
};

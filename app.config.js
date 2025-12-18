import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  // 🔑 ESTO ES LO QUE FALTABA
  scheme: 'geoferre',

  extra: {
    EXPO_PUBLIC_GOOGLE_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  },
});

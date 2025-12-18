import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  android: {
    ...config.android,
    permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },

  extra: {
    eas: {
      projectId: '97bf6ea1-e1c1-40d9-beaa-b2d6462c70c8',
    },

    // 🔑 SUPABASE (OBLIGATORIO)
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

    // 🌍 MAPS
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,

    // 🌐 BACKEND
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  },
});

import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    EXPO_PUBLIC_GOOGLE_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
  },
});

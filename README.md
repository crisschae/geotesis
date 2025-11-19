## GeoFerre - App móvil

GeoFerre es una aplicación móvil construida con **Expo + React Native** que permite a maestros, contratistas y usuarios comunes:

- Buscar materiales de construcción en ferreterías cercanas.
- Ver precios y stock en tiempo real.
- Reservar productos mediante un cupo digital antes de ir al local.

El backend se maneja con **Supabase** (Auth, Base de datos, Storage, RLS), compartido con el portal web de ferreterías.

### Estructura actual

- `app/(auth)`:
  - `login.tsx`: pantalla de inicio de sesión.
  - `register.tsx`: registro de usuario.
  - `forgot-password.tsx`: recuperación de contraseña.
- `app/(tabs)`:
  - `index.tsx`: pantalla principal (buscador + placeholder de mapa).
  - `two.tsx`: pantalla de perfil (placeholder).
- `lib/supabaseClient.ts`: cliente de Supabase configurado.
- `constants/Colors.ts`: paleta de colores base (café + crema).

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (o usa `.env.local` según tu flujo) con:

```bash
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

Estas variables son leídas por `lib/supabaseClient.ts`.

### Comandos básicos

Desde la carpeta `geoferre`:

```bash
npm install
npm run start
```

Luego escanea el QR con la app de Expo Go o ejecuta en emulador.



## GeoFerre - App móvil

GeoFerre es una aplicación móvil construida con **Expo + React Native** que permite a maestros, contratistas y usuarios comunes:

- **Buscar materiales** de construcción en ferreterías cercanas.
- **Ver precios y stock en tiempo real**.
- **Reservar productos (cupo digital)** antes de ir al local.

El backend se maneja con **Supabase** (Auth, Base de datos, Storage, RLS), **compartido con el portal web de ferreterías** (`geotesis`):

- **Repositorio portal web**: `https://github.com/crisschae/geotesis.git`

---

## Requisitos previos

- **Node.js LTS**: se recomienda **Node 18.x o 20.x** (no usar Node 22 porque rompe dependencias de Expo).
- **npm** (viene con Node).
- **Git** instalado para clonar el repositorio.
- Opcional: **Expo Go** en el celular (Android / iOS) o emulador Android/iOS instalado.

Comprueba tu versión de Node:

```bash
node -v
```

Debe mostrar `v18.x.x` o `v20.x.x` (si ves `v22.x.x`, instala una versión LTS desde la web de Node).

---

## Clonar el proyecto

1. Abre una terminal y ejecuta:

```bash
git clone https://github.com/crisschae/geotesis.git
```

> Nota: el portal web y la app móvil comparten el **mismo proyecto de Supabase**, pero el código de la app móvil vive en la carpeta `geoferre` (este repo).

Si ya tienes la carpeta `geoferre` en tu escritorio, simplemente abre esa carpeta en tu editor (VS Code, etc.).

---

## Instalación del proyecto móvil (GeoFerre)

### 1. Entrar a la carpeta del proyecto

En Windows (PowerShell):

```powershell
cd C:\Users\Criss\Desktop\geoferre
```

o, si lo clonaste en otra ruta, ve a la carpeta donde esté `geoferre`.

### 2. Instalar dependencias

Desde la carpeta `geoferre`:

```bash
npm install
```

```bash
npm install react-native-maps
```

Esto instalará, entre otras, las siguientes dependencias clave:

- **Expo** (`expo`, `expo-router`, `expo-status-bar`, etc.).
- **React / React Native**.
- **Supabase JS** (`@supabase/supabase-js`) para Auth y base de datos.
- **React Navigation** (`@react-navigation/native`).

---

## Configuración de Supabase

La app usa el mismo proyecto de Supabase que el portal web. Para conectarse, lee variables de entorno definidas en `.env`.

### 1. Crear archivo `.env`

En la **raíz del proyecto** (`geoferre/.env`), crea un archivo con el siguiente contenido (reemplaza con tus valores reales):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY_DE_SUPABASE
```

> **Importante**:
>
> - Las variables deben empezar con `EXPO_PUBLIC_` para que Expo pueda leerlas en el cliente.
> - Estos valores se consiguen en el panel de Supabase, sección **Settings → API**.

El cliente de Supabase está en `lib/supabaseClient.ts` y usa esas variables:

```12:12:lib/supabaseClient.ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. Tablas relevantes en Supabase

El proyecto usa varias tablas, compartidas con el portal web. A nivel de app móvil, la más relevante es:

- **`cliente_app`**: usuarios normales de la app (compradores).

Ejemplo de creación (solo referencia, normalmente ya está creada en tu proyecto):

```sql
create table if not exists public.cliente_app (
  id_cliente      uuid primary key default uuid_generate_v4(),
  auth_user_id    uuid not null references auth.users(id) on delete cascade,
  nombre          varchar(150),
  email           varchar(255) not null unique,
  telefono        varchar(30),
  rut             varchar(50),
  direccion       text,
  fecha_registro  timestamptz not null default now()
);

alter table public.cliente_app enable row level security;

create policy "cliente_app_select_propio"
on public.cliente_app
for select
using (auth.uid() = auth_user_id);

create policy "cliente_app_insert_propio"
on public.cliente_app
for insert
with check (auth.uid() = auth_user_id);

create policy "cliente_app_update_propio"
on public.cliente_app
for update
using (auth.uid() = auth_user_id);
```

Además, el proyecto de Supabase incluye (gestionado principalmente por el Portal Web):

- **`ferreteria`**: datos de ferreterías (dirección, lat/long, teléfono, etc.).
- **`producto`**: productos por ferretería (precio, stock, categoría, etc.).
- **`categoria`**, **`pedido`**, **`detalle_pedido`**, etc.

---

## Estructura de la app

- **`app/_layout.tsx`**: layout raíz de `expo-router` (maneja los stacks `(auth)` y `(tabs)`).
- **`app/index.tsx`**: pantalla inicial que revisa si hay sesión en Supabase y redirige a login o tabs.
- **`app/(auth)`**:
  - **`login.tsx`**: inicio de sesión (estilo crema/café, usa `supabase.auth.signInWithPassword`).
  - **`register.tsx`**: registro de usuario normal (crea usuario en Auth y en `cliente_app`, luego redirige a login).
  - **`forgot-password.tsx`**: envío de enlace de recuperación de contraseña.
- **`app/(tabs)`**:
  - **`index.tsx`**: pantalla principal (buscador + placeholder de mapa de ferreterías).
  - **`two.tsx`**: pantalla de perfil (future: datos del usuario y cerrar sesión).
- **`lib/supabaseClient.ts`**: inicialización del cliente de Supabase.
- **`constants/Colors.ts`**: paleta de colores de la app.

---

## Correr la app

1. Asegúrate de tener el `.env` configurado.
2. Desde la carpeta `geoferre`, levanta el servidor de Expo:

```bash
npm run start
```

o, equivalente:

```bash
npx expo start
```

3. Elige cómo probar:

- **Expo Go en celular**: escanea el código QR que aparece en la terminal o en la ventana de Expo.
- **Emulador Android / iOS**: usa las teclas mostradas en el CLI (`a` para Android, `i` para iOS, si están configurados).

---

## Flujo de autenticación (resumen)

- **Registro**:
  - El usuario se registra con **nombre, correo y contraseña**.
  - Se crea el usuario en **Supabase Auth**.
  - Se inserta el perfil en la tabla `cliente_app`.
  - Se cierra la sesión y se redirige al **login** para que el usuario inicie sesión manualmente.

- **Login**:
  - `supabase.auth.signInWithPassword` valida credenciales.
  - Si son correctas, se navega a `/(tabs)` (pantalla principal con mapa/buscador).

- **Recuperar contraseña**:
  - Se envía correo de recuperación con `supabase.auth.resetPasswordForEmail` (requiere configurar URL de redirección en Supabase).

---

## Notas para el equipo

- **No subir `.env` al repositorio**: contiene claves sensibles (aunque el anon key es público, es buena práctica ignorar el archivo en Git).
- Si cambias el proyecto de Supabase (nuevo workspace), **actualiza el `.env`** en todos los devs.
- Si algo falla al iniciar Expo, revisa:
  - Versión de Node (usar LTS 18/20).
  - Que `node_modules` esté instalado (`npm install` sin errores).
  - Que el `.env` tenga correctamente `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

Con este README, cualquier persona del grupo debería poder:

1. Clonar el repo.
2. Configurar el `.env` con Supabase.
3. Instalar dependencias.
4. Levantar la app y probar el flujo de login/registro.



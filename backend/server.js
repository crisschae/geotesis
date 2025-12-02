import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import pagoRoutes from './routes/pago.routes.js';

const app = express();

// CORS para Expo local (Metro) y navegadores
app.use(cors({
  origin: [
    'http://localhost:8081',  // Expo Metro
    'http://localhost:19006', // Expo web (a veces)
    'http://localhost:5173',  // Vite (por si acaso)
    'http://localhost:3000'   // navegador
  ],
  credentials: true
}));
app.use(express.json());

// Static para servir el HTML del pago falso
const __dirname = process.cwd();
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/pago', pagoRoutes);

// Health-check
app.get('/health', (_req, res) => res.json({ ok: true, service: 'geoferre-backend' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});

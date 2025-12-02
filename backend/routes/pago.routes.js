import { Router } from 'express';
import { crearPago, confirmarPagoFalso } from '../controllers/pago.controller.js';

const router = Router();

router.post('/crear', crearPago);
router.post('/falsa-confirmacion', confirmarPagoFalso);

export default router;

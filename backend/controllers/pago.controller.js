import { supabase } from '../lib/supabase.js';

// POST /api/pago/crear
export const crearPago = async (req, res) => {
  try {
    const { orderId, total } = req.body;

    if (!orderId || total == null) {
      return res.status(400).json({ error: 'orderId y total son requeridos' });
    }

    // URL del “checkout” falso (página HTML)
    const checkoutUrl = `http://192.168.18.3:${process.env.PORT}/pago-falso.html?orderId=${orderId}&total=${total}`;
    

    // (Opcional) podrías setear estado "pendiente" acá si quieres
    // await supabase.from('orders').update({ estado: 'pendiente' }).eq('id', orderId);

    return res.json({ checkoutUrl });
  } catch (err) {
    console.error('crearPago error:', err);
    return res.status(500).json({ error: 'Error creando pago simulado' });
  }
};

// POST /api/pago/falsa-confirmacion
export const confirmarPagoFalso = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) return res.status(400).json({ error: 'orderId requerido' });

    const { error } = await supabase
      .from('orders')
      .update({ estado: 'pagado' })
      .eq('id', orderId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'No se pudo actualizar el pedido' });
    }

    return res.json({ ok: true, message: 'Pago simulado confirmado' });
  } catch (err) {
    console.error('confirmarPagoFalso error:', err);
    return res.status(500).json({ error: 'Error confirmando pago simulado' });
  }
};

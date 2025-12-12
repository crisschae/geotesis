require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ==========================
// 🔐 STRIPE WEBHOOK (PRIMERO)
// ==========================
app.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object;

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('✅ Pago confirmado:', data.id);
        // 👉 aquí luego conectas Supabase:
        // - pedido → pagado
        // - insertar en pagos
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Pago fallido:', data.id);
        break;

      default:
        console.log(`ℹ Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// ==========================
// Middleware normal
// ==========================
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Stripe backend OK'));

// Crear PaymentIntent
app.post('/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'amount inválido' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'clp',
      automatic_payment_methods: { enabled: true },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(400).json({ error: err.message });
  }
});

// Puerto dinámico (Render OK)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Stripe backend corriendo en puerto ${port}`);
});

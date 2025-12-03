require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// CORS abierto: ajusta si quieres más estricto
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Stripe backend OK'));

// Crear PaymentIntent (monto en pesos CLP, entero)
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
      paymentIntentId: paymentIntent.id,   // 🔥 ESTO ES LO QUE FALTABA
    });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(400).json({ error: err.message });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Stripe backend corriendo en http://localhost:${port}`);
});

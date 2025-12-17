import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/**
 * ==========================
 * CONFIG BÁSICA
 * ==========================
 */
app.use(cors());
app.use(express.json());

/**
 * ==========================
 * STRIPE INIT
 * ==========================
 */
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY no está definida en el entorno");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * ==========================
 * HEALTH CHECK
 * ==========================
 */
app.get("/", (req, res) => {
  res.json({ status: "GeoFerre Stripe Backend OK" });
});

/**
 * =====================================================
 * 🔵 PAYMENT INTENT (STRIPE NATIVO / FUTURO BUILD)
 * =====================================================
 * (Se mantiene para cuando uses Dev Build o producción nativa)
 */
app.post("/stripe/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number") {
      return res.status(400).json({ error: "amount inválido" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "clp",
      automatic_payment_methods: { enabled: true },
    });

    return res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("❌ PaymentIntent error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * =====================================================
 * 🟢 STRIPE CHECKOUT (WEB – EXPO GO / MODAL)
 * =====================================================
 */
app.post("/pago/checkout", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number") {
      return res.status(400).json({ error: "amount inválido" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "clp",
            product_data: {
              name: "Compra GeoFerre",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: "geoferre://payment-return?status=success",
      cancel_url: "geoferre://payment-return?status=cancel",
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Checkout error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * ==========================
 * STRIPE WEBHOOK (OPCIONAL)
 * ==========================
 * (Se deja activo para futuro)
 */
app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    res.json({ received: true });
  }
);

/**
 * ==========================
 * SERVER
 * ==========================
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Stripe backend corriendo en puerto ${PORT}`);
});

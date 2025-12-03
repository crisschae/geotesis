const API = "http://192.168.18.3:3000"; 

export async function createPaymentIntent(amount: number) {
  const r = await fetch(`${API}/stripe/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  if (!r.ok) throw new Error("Error creando PaymentIntent");

  // 👇 devolvemos TODOS los campos que devuelve el backend
  return r.json() as Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }>;
}

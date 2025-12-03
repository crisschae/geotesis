import { api } from "./api";

type CreatePIResponse = {
  clientSecret: string;
  paymentIntentId: string;
};

export async function createPaymentIntent(amount: number): Promise<CreatePIResponse> {
  // amount en CENTAVOS (ej: $5.000 CLP = 500000 si CLP usa 2 decimales o según tu backend)
  return api.post<CreatePIResponse>("/stripe/create-payment-intent", { amount });
}

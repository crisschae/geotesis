import * as Linking from "expo-linking";
import { useEffect } from "react";

export function usePaymentReturn(onResult: (token: string) => void) {
  useEffect(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      const url = event.url;
      const parsed = Linking.parse(url);

      // geoferre://pago-retorno?token=pp_xyz
      const token = parsed.queryParams?.token as string;

      if (token) onResult(token);
    });

    return () => subscription.remove();
  }, []);
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error("❌ EXPO_PUBLIC_API_URL no está definida en .env");
}

export const api = {
  get: async <T = any>(path: string): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return res.json();
  },
  post: async <T = any>(path: string, body: any, headers?: Record<string,string>): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`POST ${path} → ${res.status}: ${txt}`);
    }
    return res.json();
  },
};

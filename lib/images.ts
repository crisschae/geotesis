export const normalizarImagenes = (data: any): string[] => {
  if (!data) return [];

  let parsed = data;

  // 🔹 Intentar parsear hasta 2 veces (por strings dobles)
  for (let i = 0; i < 2; i++) {
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }
  }

  // 🔹 Caso: array de strings
  if (Array.isArray(parsed)) {
    if (typeof parsed[0] === "string") {
      return parsed;
    }

    // 🔹 Caso: array de objetos { url }
    if (typeof parsed[0] === "object" && parsed[0]?.url) {
      return parsed.map((i) => i.url);
    }
  }

  // 🔹 Caso: string URL directa
  if (typeof data === "string" && data.startsWith("http")) {
    return [data];
  }
  
  return [];
};

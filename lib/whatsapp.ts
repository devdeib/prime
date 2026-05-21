const DEFAULT_PHONE_DIGITS = "39998656633344";

/** Strip to digits for wa.me (drop leading +). */
export function normalizeWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

export function buildWhatsAppOrderUrl(phoneDigits: string, productName: string): string {
  const phone = normalizeWhatsAppPhone(phoneDigits) || DEFAULT_PHONE_DIGITS;
  const text = encodeURIComponent(
    `Hello, I would like to order: ${productName.trim() || "this product"}`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export async function fetchContactPhoneDigits(): Promise<string> {
  try {
    const res = await fetch("/api/be/site-content/contact");
    if (!res.ok) return DEFAULT_PHONE_DIGITS;
    const json = (await res.json()) as {
      phone_value_en?: string;
      phone_value_ar?: string;
    };
    const raw = json.phone_value_en?.trim() || json.phone_value_ar?.trim() || "";
    return normalizeWhatsAppPhone(raw) || DEFAULT_PHONE_DIGITS;
  } catch {
    return DEFAULT_PHONE_DIGITS;
  }
}

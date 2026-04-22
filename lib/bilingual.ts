/** Pick display string for current UI language (`en` | `ar`). */
export function pickLocalized(
  locale: string,
  en?: string | null,
  ar?: string | null
): string {
  const useAr = locale === "ar" || locale.startsWith("ar-");
  const a = (ar ?? "").trim();
  const e = (en ?? "").trim();
  if (useAr && a) return a;
  if (e) return e;
  return a;
}

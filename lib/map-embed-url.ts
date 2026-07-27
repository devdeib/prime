/**
 * Build a Google Maps embed URL for iframes (avoids loading full Maps UI in embed).
 * Short links (maps.app.goo.gl / goo.gl) are not parseable here — use
 * resolveGoogleMapsShortLinkToEmbedUrl on the server after following redirects.
 */
export function toEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/maps/embed") || trimmed.includes("output=embed")) {
    return trimmed.startsWith("http") ? trimmed : `https:${trimmed}`;
  }

  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./, "");

    if (!host.includes("google.")) return null;

    const coordInPath = u.pathname.match(/@(-?\d+\.[\d]+),(-?\d+\.[\d]+)/);
    if (coordInPath) {
      const [, lat, lng] = coordInPath;
      return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }

    const q = u.searchParams.get("q");
    if (q) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
    }

    const ll = u.searchParams.get("ll");
    if (ll && /^-?\d+\.[\d]+,-?\d+\.[\d]+$/.test(ll.trim())) {
      const [lat, lng] = ll.trim().split(",");
      return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }

    const placeMatch = u.pathname.match(/\/place\/([^/?]+)/);
    if (placeMatch) {
      const place = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      return `https://www.google.com/maps?q=${encodeURIComponent(place)}&z=15&output=embed`;
    }
  } catch {
    return null;
  }

  return null;
}

const SHORT_MAP_LINK_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "maps.goo.gl",
]);

function isAllowedGoogleMapsShortLink(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return SHORT_MAP_LINK_HOSTS.has(host);
  } catch {
    return false;
  }
}

/**
 * Follows a Google Maps short URL server-side and returns an iframe-safe embed URL.
 * Restricted host allowlist to reduce SSRF risk.
 */
export async function resolveGoogleMapsShortLinkToEmbedUrl(
  rawUrl: string
): Promise<string | null> {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (!isAllowedGoogleMapsShortLink(withProto)) return null;

  try {
    const res = await fetch(withProto, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; PrimeMapResolver/1.0; +https://www.google.com/bot.html)",
      },
    });

    const finalUrl = res.url;
    if (!finalUrl) return null;

    const embed = toEmbedUrl(finalUrl);
    if (embed) return embed;

    return toEmbedUrl(withProto);
  } catch {
    return null;
  }
}

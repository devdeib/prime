import fs from "fs";
import path from "path";

const STOREFRONT_CONTENT_PATH = path.join(
  process.cwd(),
  "data",
  ".storefront-content.json"
);

export type StorefrontHeroCopy = {
  title_en?: string;
  title_ar?: string;
  subtitle_en?: string;
  subtitle_ar?: string;
};

type StorefrontContent = {
  productLinks: Record<string, string>;
  heroCopy: StorefrontHeroCopy;
};

function defaultContent(): StorefrontContent {
  return {
    productLinks: {},
    heroCopy: {},
  };
}

function normalizeContent(
  parsed: Partial<StorefrontContent> | null | undefined
): StorefrontContent {
  return {
    productLinks:
      parsed?.productLinks && typeof parsed.productLinks === "object"
        ? Object.fromEntries(
            Object.entries(parsed.productLinks)
              .map(([key, value]) => [String(key), String(value).trim()])
              .filter(([, value]) => value.length > 0)
          )
        : {},
    heroCopy:
      parsed?.heroCopy && typeof parsed.heroCopy === "object"
        ? {
            title_en: parsed.heroCopy.title_en?.trim() || undefined,
            title_ar: parsed.heroCopy.title_ar?.trim() || undefined,
            subtitle_en: parsed.heroCopy.subtitle_en?.trim() || undefined,
            subtitle_ar: parsed.heroCopy.subtitle_ar?.trim() || undefined,
          }
        : {},
  };
}

export function loadStorefrontContent(): StorefrontContent {
  try {
    if (!fs.existsSync(STOREFRONT_CONTENT_PATH)) {
      const initial = defaultContent();
      saveStorefrontContent(initial);
      return initial;
    }
    const raw = fs.readFileSync(STOREFRONT_CONTENT_PATH, "utf-8");
    return normalizeContent(
      JSON.parse(raw) as Partial<StorefrontContent> | undefined
    );
  } catch {
    const initial = defaultContent();
    saveStorefrontContent(initial);
    return initial;
  }
}

export function saveStorefrontContent(content: StorefrontContent) {
  fs.mkdirSync(path.dirname(STOREFRONT_CONTENT_PATH), { recursive: true });
  fs.writeFileSync(
    STOREFRONT_CONTENT_PATH,
    JSON.stringify(normalizeContent(content), null, 2),
    "utf-8"
  );
}

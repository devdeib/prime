import fs from "fs";
import path from "path";
import type { ApiUser } from "@/data/types/auth";

/**
 * Local JSON persistence when no real API (`API_BASE` unset).
 * When `API_BASE` is set, the BFF proxies to your backend instead.
 */
const STORE_PATH = path.join(process.cwd(), "data", ".mock-backend-store.json");

export type MockStoredUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
};

export type MockStoredProduct = {
  id: number;
  name: string;
  name_ar?: string;
  price: number;
  category: string;
  descriptions?: string;
  descriptions_ar?: string;
  /** Public URL path e.g. `/uploads/products/abc.jpg` (local mock uploads) */
  image_url?: string;
};

export type MockStoredCategory = {
  id: number;
  name: string;
  name_ar?: string;
  alias: string;
};

/** Homepage hero — `image_url` is a public URL or `/uploads/...` path */
export type MockStoredHeroSlide = {
  id: number;
  image_url: string;
  sort_order: number;
};

/** Showroom listing for storefront + dashboard CRUD */
export type MockStoredShowroom = {
  id: number;
  name: string;
  name_ar?: string;
  city?: string;
  city_ar?: string;
  address?: string;
  address_ar?: string;
  description?: string;
  description_ar?: string;
  images?: string[];
  image_url?: string;
  sort_order: number;
};

type StoreFile = {
  users: MockStoredUser[];
  products: MockStoredProduct[];
  categories: MockStoredCategory[];
  heroSlides: MockStoredHeroSlide[];
  showrooms: MockStoredShowroom[];
  nextUserId: number;
  nextProductId: number;
  nextCategoryId: number;
  nextHeroSlideId: number;
  nextShowroomId: number;
};

export const DEFAULT_CATEGORIES: MockStoredCategory[] = [
  { id: 1, name: "Sofas", name_ar: "كنب", alias: "sofas" },
  { id: 2, name: "Corner Sets", name_ar: "طقم زاوية", alias: "corner-set" },
  { id: 3, name: "Beds", name_ar: "أسرة", alias: "beds" },
  { id: 4, name: "Dining Tables", name_ar: "طاولات طعام", alias: "dining-tables" },
  { id: 5, name: "Chairs", name_ar: "كراسي", alias: "chairs" },
  { id: 6, name: "Wardrobes", name_ar: "خزائن", alias: "wardrobes" },
  { id: 7, name: "Others", name_ar: "أخرى", alias: "others" },
];

const DEFAULT_HERO_SLIDES: MockStoredHeroSlide[] = [
  {
    id: 1,
    image_url: "https://picsum.photos/seed/bakery-hero-1/1920/1080",
    sort_order: 0,
  },
  {
    id: 2,
    image_url: "https://picsum.photos/seed/bakery-hero-2/1920/1080",
    sort_order: 1,
  },
  {
    id: 3,
    image_url: "https://picsum.photos/seed/bakery-hero-3/1920/1080",
    sort_order: 2,
  },
  {
    id: 4,
    image_url: "https://picsum.photos/seed/bakery-hero-4/1920/1080",
    sort_order: 3,
  },
];

const DEFAULT_SHOWROOMS: MockStoredShowroom[] = [
  {
    id: 1,
    name: "Riyadh Gallery",
    name_ar: "رياض جاليري",
    city: "Riyadh",
    city_ar: "الرياض",
    sort_order: 0,
    description: "Visit our curated display of living and dining collections.",
    description_ar: "تفضل بزيارة معرضنا للمجموعات المعيشية.",
  },
  {
    id: 2,
    name: "Jeddah Boulevard",
    name_ar: "جدة بولفارد",
    city: "Jeddah",
    city_ar: "جدة",
    sort_order: 1,
    description: "Experience materials and finishes in person.",
    description_ar: "اختبر المواد واللمسات عن قرب.",
  },
];

const DEFAULT_PRODUCTS: MockStoredProduct[] = [
  {
    id: 1,
    name: "Modern Sofa Set",
    name_ar: "طقم كنب عصري",
    price: 18999,
    category: "sofas",
    descriptions: "Comfortable 3-seater fabric sofa with clean modern lines.",
    descriptions_ar: "كنب قماشي مريح بثلاثة مقاعد وخطوط عصرية.",
  },
  {
    id: 2,
    name: "Leather Sofa 3+2",
    name_ar: "كنب جلد 3+2",
    price: 25999,
    category: "sofas",
    descriptions: "Premium leather seating with deep cushions.",
    descriptions_ar: "جلد فاخر مع وسائد عميقة.",
  },
  {
    id: 3,
    name: "L-Shaped Corner Set",
    name_ar: "كنب زاوية على شكل L",
    price: 20500,
    category: "corner-set",
    descriptions: "Space-smart corner layout for living rooms.",
    descriptions_ar: "تخطيط زاوية يوفر المساحة لغرف المعيشة.",
  },
  {
    id: 4,
    name: "Compact Corner Sofa",
    name_ar: "كنب زاوية مدمج",
    price: 18500,
    category: "corner-set",
    descriptions: "Compact footprint, generous seating.",
    descriptions_ar: "حجم مدمج مع مقاعد واسعة.",
  },
  {
    id: 5,
    name: "Queen Size Bed",
    name_ar: "سرير كوين",
    price: 17000,
    category: "beds",
    descriptions: "Sturdy frame with a refined headboard.",
    descriptions_ar: "هيكل متين مع تاج أنيق.",
  },
  {
    id: 6,
    name: "King Size Wooden Bed",
    name_ar: "سرير كينغ خشبي",
    price: 25500,
    category: "beds",
    descriptions: "Solid wood construction with warm finish.",
    descriptions_ar: "تصنيع خشب صلب بلمسة دافئة.",
  },
  {
    id: 7,
    name: "Dining Table 6-Seater",
    name_ar: "طاولة طعام لستة أشخاص",
    price: 14999,
    category: "dining-tables",
    descriptions: "Seats six comfortably for family meals.",
    descriptions_ar: "تتسع لستة أشخاص بسهولة.",
  },
  {
    id: 8,
    name: "Glass Top Dining Set",
    name_ar: "طقم طعام بسطح زجاجي",
    price: 18000,
    category: "dining-tables",
    descriptions: "Tempered glass top with durable legs.",
    descriptions_ar: "سطح زجاجي مقوّى مع أرجل متينة.",
  },
  {
    id: 9,
    name: "Upholstered Chair",
    name_ar: "كرسي مبطّن",
    price: 3499,
    category: "chairs",
    descriptions: "Soft upholstery for long sitting comfort.",
    descriptions_ar: "تنجيد ناعم لراحة طويلة.",
  },
  {
    id: 10,
    name: "Rocking Chair",
    name_ar: "كرسي هزاز",
    price: 4800,
    category: "chairs",
    descriptions: "Classic rocking motion, stable base.",
    descriptions_ar: "حركة هزازة كلاسيكية وقاعدة ثابتة.",
  },
  {
    id: 11,
    name: "Sliding Door Wardrobe",
    name_ar: "خزانة أبواب منزلقة",
    price: 22500,
    category: "wardrobes",
    descriptions: "Sliding doors to save bedroom space.",
    descriptions_ar: "أبواب منزلقة لتوفير مساحة الغرفة.",
  },
  {
    id: 12,
    name: "Classic Wardrobe 3-Door",
    name_ar: "خزانة كلاسيكية بثلاثة أبواب",
    price: 18900,
    category: "wardrobes",
    descriptions: "Three-door storage with hanging rails.",
    descriptions_ar: "تخزين بثلاثة أبواب مع علاقات تعليق.",
  },
];

function seedStore(): StoreFile {
  return {
    users: [
      {
        id: 1,
        first_name: "Admin",
        last_name: "VG",
        email: "admin@vg.local",
        phone: "01700000001",
        password: "admin123",
        role: "admin",
      },
      {
        id: 2,
        first_name: "Demo",
        last_name: "User",
        email: "demo@vg.local",
        phone: "01700000002",
        password: "demo123",
        role: "user",
      },
    ],
    products: DEFAULT_PRODUCTS.map((p) => ({ ...p })),
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    heroSlides: DEFAULT_HERO_SLIDES.map((h) => ({ ...h })),
    showrooms: DEFAULT_SHOWROOMS.map((s) => ({ ...s })),
    nextUserId: 3,
    nextProductId: 13,
    nextCategoryId: 8,
    nextHeroSlideId: 5,
    nextShowroomId: 3,
  };
}

function normalizeStore(parsed: Partial<StoreFile>): StoreFile {
  const base = seedStore();
  if (!parsed.users?.length) parsed.users = base.users;
  if (!parsed.products) parsed.products = base.products;
  if (!parsed.categories?.length) parsed.categories = base.categories;
  if (!parsed.heroSlides?.length) parsed.heroSlides = base.heroSlides;
  if (!parsed.showrooms?.length) parsed.showrooms = base.showrooms;
  if (parsed.nextUserId == null) parsed.nextUserId = base.nextUserId;
  if (parsed.nextProductId == null) parsed.nextProductId = base.nextProductId;
  if (parsed.nextCategoryId == null) {
    const maxId = Math.max(0, ...parsed.categories.map((c) => c.id));
    parsed.nextCategoryId = maxId + 1;
  }
  if (parsed.nextHeroSlideId == null) {
    const maxH = Math.max(0, ...(parsed.heroSlides ?? []).map((h) => h.id));
    parsed.nextHeroSlideId = maxH + 1;
  }
  if (parsed.nextShowroomId == null) {
    const maxS = Math.max(0, ...(parsed.showrooms ?? []).map((s) => s.id));
    parsed.nextShowroomId = maxS + 1;
  }
  return enrichBilingualDefaults(parsed as StoreFile);
}

/** Merge Arabic / description defaults from seed data by id or alias (non-destructive). */
function enrichBilingualDefaults(store: StoreFile): StoreFile {
  const catByAlias = new Map(DEFAULT_CATEGORIES.map((c) => [c.alias, c]));
  const prodById = new Map(DEFAULT_PRODUCTS.map((p) => [p.id, p]));

  const categories = store.categories.map((c) => {
    const d = catByAlias.get(c.alias);
    if (!d) return c;
    return {
      ...c,
      name_ar: c.name_ar?.trim() ? c.name_ar : d.name_ar,
    };
  });

  const products = store.products.map((p) => {
    const d = prodById.get(p.id);
    if (!d) return p;
    return {
      ...p,
      name_ar: p.name_ar?.trim() ? p.name_ar : d.name_ar,
      descriptions: p.descriptions?.trim() ? p.descriptions : d.descriptions,
      descriptions_ar: p.descriptions_ar?.trim()
        ? p.descriptions_ar
        : d.descriptions_ar,
    };
  });

  const showrooms = store.showrooms.map((s) => {
    const normalizedImages = Array.isArray(s.images)
      ? s.images.map((img) => String(img).trim()).filter(Boolean)
      : s.image_url?.trim()
        ? [s.image_url.trim()]
        : [];

    return {
      ...s,
      images: normalizedImages,
      image_url: normalizedImages[0],
    };
  });

  return { ...store, categories, products, showrooms };
}

export function loadStore(): StoreFile {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const s = seedStore();
      saveStore(s);
      return s;
    }
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreFile>;
    const needsMigration =
      !parsed.categories?.length ||
      parsed.nextCategoryId == null ||
      !parsed.users?.length ||
      !Array.isArray(parsed.products) ||
      !Array.isArray(parsed.heroSlides) ||
      !Array.isArray(parsed.showrooms) ||
      parsed.nextHeroSlideId == null ||
      parsed.nextShowroomId == null;
    const normalized = normalizeStore(parsed);
    if (needsMigration) saveStore(normalized);
    return normalized;
  } catch {
    const s = seedStore();
    saveStore(s);
    return s;
  }
}

export function saveStore(store: StoreFile): void {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function toApiUser(u: MockStoredUser): ApiUser {
  return {
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    email_verified_at: new Date().toISOString(),
    email: u.email,
    phone: u.phone,
    is_active: true,
    is_verified: true,
    role: u.role,
  };
}

const MOCK_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 365;

export function buildLoginResponse(u: MockStoredUser) {
  const expires_at = Date.now() + MOCK_TOKEN_TTL_MS;
  return {
    access_token: `mock-access-${u.id}-${expires_at}`,
    refresh_token: `mock-refresh-${u.id}`,
    expires_at,
    user: toApiUser(u),
  };
}

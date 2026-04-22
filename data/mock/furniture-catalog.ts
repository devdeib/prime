export type MockCategory = {
  id: string;
  name: string;
  slug: string;
};

export type MockProduct = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  price: number;
  shortDescription: string;
  description: string;
  /** picsum seed for stable mock images */
  imageSeed: string;
  specs: { label: string; value: string }[];
};

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: "c1", name: "Sofas", slug: "sofas" },
  { id: "c2", name: "Corner Sets", slug: "corner-set" },
  { id: "c3", name: "Beds", slug: "beds" },
  { id: "c4", name: "Dining Tables", slug: "dining-tables" },
  { id: "c5", name: "Chairs", slug: "chairs" },
  { id: "c6", name: "Wardrobes", slug: "wardrobes" },
  { id: "c7", name: "Others", slug: "others" },
];

// Source of truth for furniture mock data (static catalog; API mock lives in `/api/be`)
export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "p1",
    name: "Modern Sofa Set",
    slug: "modern-sofa-set",
    categoryId: "c1",
    price: 18999,
    shortDescription: "Comfortable 3+2 seater modern style",
    description:
      "A contemporary sofa set with plush upholstery, perfect for modern living rooms.",
    imageSeed: "furniture-sofa-1",
    specs: [
      { label: "Seats", value: "3+2" },
      { label: "Material", value: "Linen blend" },
    ],
  },
  {
    id: "p2",
    name: "Leather Sofa 3+2",
    slug: "leather-sofa-3-2",
    categoryId: "c1",
    price: 25999,
    shortDescription: "Genuine leather for luxury",
    description:
      "Genuine leather sofa set designed for maximum comfort and timeless style.",
    imageSeed: "furniture-sofa-2",
    specs: [
      { label: "Seats", value: "3+2" },
      { label: "Material", value: "Real leather" },
    ],
  },
  {
    id: "p3",
    name: "L-Shaped Corner Set",
    slug: "l-shaped-corner-set",
    categoryId: "c2",
    price: 20500,
    shortDescription: "Space-saving L shape",
    description:
      "Practical L-shaped corner sofa, ideal for apartments and family living.",
    imageSeed: "furniture-corner-1",
    specs: [
      { label: "Shape", value: "L-Shape" },
      { label: "Removable Covers", value: "Yes" },
    ],
  },
  {
    id: "p4",
    name: "Compact Corner Sofa",
    slug: "compact-corner-sofa",
    categoryId: "c2",
    price: 18500,
    shortDescription: "Compact comfort for any room",
    description:
      "Small corner sofa for cozy settings; fits perfectly in compact spaces.",
    imageSeed: "furniture-corner-2",
    specs: [
      { label: "Length", value: "210 cm" },
      { label: "Warranty", value: "2 years" },
    ],
  },
  {
    id: "p5",
    name: "Queen Size Bed",
    slug: "queen-size-bed",
    categoryId: "c3",
    price: 17000,
    shortDescription: "Modern wooden queen bed",
    description:
      "Queen-size bed with solid wood frame and a premium finish.",
    imageSeed: "furniture-bed-1",
    specs: [
      { label: "Size", value: "Queen" },
      { label: "Material", value: "Solid wood" },
    ],
  },
  {
    id: "p6",
    name: "King Size Wooden Bed",
    slug: "king-size-wooden-bed",
    categoryId: "c3",
    price: 25500,
    shortDescription: "Large king bed with headboard",
    description:
      "Spacious king-size wooden bed with decorative headboard; suited for master bedrooms.",
    imageSeed: "furniture-bed-2",
    specs: [
      { label: "Size", value: "King" },
      { label: "With Storage", value: "No" },
    ],
  },
  {
    id: "p7",
    name: "Dining Table 6-Seater",
    slug: "dining-table-6-seater",
    categoryId: "c4",
    price: 14999,
    shortDescription: "Six seater, modern finish",
    description:
      "Dining table with 6 chairs, crafted from engineered wood, modern design.",
    imageSeed: "furniture-dining-1",
    specs: [
      { label: "Seats", value: "6" },
      { label: "Table Shape", value: "Rectangle" },
    ],
  },
  {
    id: "p8",
    name: "Glass Top Dining Set",
    slug: "glass-top-dining-set",
    categoryId: "c4",
    price: 18000,
    shortDescription: "Elegant glass tabletop",
    description:
      "Dining set with a tempered glass table and comfortable padded chairs.",
    imageSeed: "furniture-dining-2",
    specs: [
      { label: "Glass Type", value: "Tempered" },
      { label: "Seats", value: "6" },
    ],
  },
  {
    id: "p9",
    name: "Upholstered Chair",
    slug: "upholstered-chair",
    categoryId: "c5",
    price: 3499,
    shortDescription: "Classic accent chair",
    description:
      "A plush upholstered chair suitable for living rooms or bedrooms.",
    imageSeed: "furniture-chair-1",
    specs: [
      { label: "Color Options", value: "3" },
      { label: "Material", value: "Velvet" },
    ],
  },
  {
    id: "p10",
    name: "Rocking Chair",
    slug: "rocking-chair",
    categoryId: "c5",
    price: 4800,
    shortDescription: "Relaxing wooden rocker",
    description:
      "Traditional wooden rocking chair, perfect for reading nooks and porches.",
    imageSeed: "furniture-chair-2",
    specs: [
      { label: "Style", value: "Classic" },
      { label: "Finishing", value: "Polished" },
    ],
  },
  {
    id: "p11",
    name: "Sliding Door Wardrobe",
    slug: "sliding-door-wardrobe",
    categoryId: "c6",
    price: 22500,
    shortDescription: "Wardrobe with sliding doors",
    description:
      "Spacious wardrobe with smooth sliding doors and in-built shelves.",
    imageSeed: "furniture-wardrobe-1",
    specs: [
      { label: "Doors", value: "2 Sliding" },
      { label: "Height", value: "210 cm" },
    ],
  },
  {
    id: "p12",
    name: "Classic Wardrobe 3-Door",
    slug: "classic-wardrobe-3-door",
    categoryId: "c6",
    price: 18900,
    shortDescription: "3-door wardrobe for convenience",
    description:
      "Classic style, three-door wardrobe for extra storage.",
    imageSeed: "furniture-wardrobe-2",
    specs: [
      { label: "Doors", value: "3 Hinged" },
      { label: "With Mirror", value: "Yes" },
    ],
  },
];

// Helper to get products per category (null = all)
export function getProductsByCategory(categoryId: string | null) {
  if (!categoryId) return MOCK_PRODUCTS;
  return MOCK_PRODUCTS.filter((p) => p.categoryId === categoryId);
}

export function getProductById(id: string) {
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}

/** Legacy paths from old storefront → mock catalog slugs */
const ROUTE_SLUG_ALIASES: Record<string, string> = {
  sofaset: "sofas",
  bedsheet: "beds",
};

export function normalizeProductRouteSlug(slug: string): string {
  return ROUTE_SLUG_ALIASES[slug] ?? slug;
}

/** URL segment under `/products/[category]` → internal category id (or all) */
export function resolveRouteSlugToCategoryId(
  slug: string | undefined
): string | null {
  if (!slug || slug === "all-items") return null;
  const normalized = normalizeProductRouteSlug(slug);
  const cat = MOCK_CATEGORIES.find((c) => c.slug === normalized);
  return cat?.id ?? null;
}

export function categoryIdToProductRouteSlug(categoryId: string | null): string {
  if (!categoryId) return "all-items";
  return MOCK_CATEGORIES.find((c) => c.id === categoryId)?.slug ?? "all-items";
}

import fs from "fs";
import path from "path";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import type { ApiUser } from "@/data/types/auth";
import {
  buildLoginResponse,
  loadStore,
  saveStore,
  toApiUser,
  type MockStoredCategory,
  type MockStoredHeroSlide,
  type MockStoredProject,
  type MockStoredProduct,
  type MockStoredShowroom,
  type MockStoredUser,
} from "@/lib/mock-backend-store";

function segmentsFromPath(pathname: string) {
  return pathname
    .replace(/^\/api\/be\/?/i, "")
    .split("/")
    .filter(Boolean);
}

function sessionRole(session: Session | null): string | undefined {
  return (session as { role?: string } | null)?.role;
}

function sessionUserId(session: Session | null): number | null {
  const u = (session as { user?: { id?: number } } | null)?.user;
  if (u?.id == null) return null;
  return Number(u.id);
}

function canAccessUser(
  session: Session | null,
  targetId: number
): boolean {
  const role = sessionRole(session);
  const uid = sessionUserId(session);
  if (uid == null) return false;
  if (role === "admin") return true;
  return uid === targetId;
}

function slugifyAlias(name: string, explicit?: string): string {
  const raw = (explicit ?? name).trim().toLowerCase();
  return raw
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "category";
}

function formatCategoryRow(c: MockStoredCategory) {
  const nowIso = new Date().toISOString();
  return {
    id: c.id,
    name: c.name,
    name_ar: c.name_ar ?? null,
    alias: c.alias,
    created_at: nowIso,
    updated_at: nowIso,
    storage_file: {
      id: c.id,
      type: "category",
      size: "0",
      public_id: `category-${c.id}`,
      image_url: "/images/La dolce casa.svg",
      category_id: c.id,
      created_at: nowIso,
      updated_at: nowIso,
    },
  };
}

function formatProductRow(
  item: MockStoredProduct,
  categories: MockStoredCategory[]
) {
  const nowIso = new Date().toISOString();
  const categoryId =
    categories.find((c) => c.alias === item.category)?.id ??
    categories[0]?.id ??
    1;
  const imageUrl =
    item.image_url && item.image_url.trim() !== ""
      ? item.image_url
      : "/images/La dolce casa.svg";
  const descEn =
    item.descriptions?.trim() ?? `${item.name} from La Dolce Casa`;
  const descAr =
    item.descriptions_ar?.trim() ??
    (item.name_ar?.trim()
      ? `${item.name_ar.trim()} من متجر لا دولتشي كازا`
      : null);
  return {
    id: item.id,
    name: item.name,
    name_ar: item.name_ar ?? null,
    descriptions: descEn,
    descriptions_ar: descAr,
    quantity: 10,
    weight: 30,
    price: item.price,
    sku: `SKU-${item.id}`,
    category_id: categoryId,
    category: item.category,
    created_at: nowIso,
    updated_at: nowIso,
    storage_files: [
      {
        id: item.id,
        type: "product",
        size: "0",
        public_id: `product-${item.id}`,
        image_url: imageUrl,
        product_id: item.id,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ],
  };
}

function tryRemoveUploadedImage(relativeUrl: string | undefined) {
  if (!relativeUrl?.startsWith("/uploads/products/")) return;
  const full = path.join(process.cwd(), "public", relativeUrl);
  try {
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    /* ignore */
  }
}

function listPublicProductUploads(): string[] {
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  try {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .map((f) => `/uploads/products/${f}`);
  } catch {
    return [];
  }
}

function heroImageCandidates(store: ReturnType<typeof loadStore>): string[] {
  const set = new Set<string>();
  for (const p of store.products) {
    if (p.image_url?.trim()) set.add(p.image_url.trim());
  }
  for (const h of store.heroSlides) {
    if (h.image_url.trim()) set.add(h.image_url.trim());
  }
  for (const project of store.projects) {
    const images =
      Array.isArray(project.images) && project.images.length > 0
        ? project.images
        : project.image_url?.trim()
          ? [project.image_url.trim()]
          : [];
    for (const image of images) set.add(image);
  }
  for (const u of listPublicProductUploads()) set.add(u);
  return Array.from(set).sort();
}

function formatShowroomRow(s: MockStoredShowroom) {
  const images =
    Array.isArray(s.images) && s.images.length > 0
      ? s.images
      : s.image_url?.trim()
        ? [s.image_url.trim()]
        : [];

  return {
    id: s.id,
    name: s.name,
    name_ar: s.name_ar ?? null,
    city: s.city ?? null,
    city_ar: s.city_ar ?? null,
    address: s.address ?? null,
    address_ar: s.address_ar ?? null,
    description: s.description ?? null,
    description_ar: s.description_ar ?? null,
    images,
    image_url: images[0] ?? null,
    sort_order: s.sort_order,
  };
}

function formatProjectRow(p: MockStoredProject) {
  const images =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : p.image_url?.trim()
        ? [p.image_url.trim()]
        : [];

  return {
    id: p.id,
    name: p.name,
    name_ar: p.name_ar ?? null,
    city: p.city ?? null,
    city_ar: p.city_ar ?? null,
    address: p.address ?? null,
    address_ar: p.address_ar ?? null,
    description: p.description ?? null,
    description_ar: p.description_ar ?? null,
    images,
    image_url: images[0] ?? null,
    sort_order: p.sort_order,
  };
}

function normalizeShowroomImages(body: Partial<MockStoredShowroom>): string[] {
  const rawImages = Array.isArray(body.images) ? body.images : [];
  const images = rawImages
    .map((img) => String(img).trim())
    .filter(Boolean);

  if (images.length > 0) return images;
  if (body.image_url?.trim()) return [String(body.image_url).trim()];
  return [];
}

function normalizeProjectImages(body: Partial<MockStoredProject>): string[] {
  const rawImages = Array.isArray(body.images) ? body.images : [];
  const images = rawImages
    .map((img) => String(img).trim())
    .filter(Boolean);

  if (images.length > 0) return images;
  if (body.image_url?.trim()) return [String(body.image_url).trim()];
  return [];
}

function removeUnusedUploadedImages(nextImages: string[], prevImages: string[]) {
  const keep = new Set(nextImages);
  for (const img of prevImages) {
    if (!keep.has(img)) tryRemoveUploadedImage(img);
  }
}

function getProductsPayload(
  products: MockStoredProduct[],
  categories: MockStoredCategory[],
  category: string | null
) {
  const list =
    category && category !== "all-items"
      ? products.filter((p) => p.category === category)
      : products;
  return { data: list.map((p) => formatProductRow(p, categories)) };
}

export async function tryMockBeRequest(
  req: NextRequest,
  method: string,
  session: Session | null
): Promise<NextResponse | null> {
  const pathname = req.nextUrl.pathname;
  const segments = segmentsFromPath(pathname);
  const sp = req.nextUrl.searchParams;

  if (method === "GET" && segments[0] === "categories" && segments.length === 1) {
    const store = loadStore();
    return NextResponse.json({
      data: store.categories.map((c) => formatCategoryRow(c)),
    });
  }

  if (method === "POST" && segments[0] === "categories" && segments.length === 1) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const body = (await req.json()) as {
      name?: string;
      name_ar?: string;
      alias?: string;
    };
    const store = loadStore();
    let alias = slugifyAlias(String(body.name ?? "category"), body.alias);
    if (store.categories.some((c) => c.alias === alias)) {
      alias = `${alias}-${store.nextCategoryId}`;
    }
    const nameArRaw =
      body.name_ar != null ? String(body.name_ar).trim() : "";
    const row: MockStoredCategory = {
      id: store.nextCategoryId++,
      name: String(body.name ?? "New category").trim() || "New category",
      alias,
      ...(nameArRaw ? { name_ar: nameArRaw } : {}),
    };
    store.categories.push(row);
    saveStore(store);
    return NextResponse.json(
      { data: formatCategoryRow(row) },
      { status: 201 }
    );
  }

  if (
    (method === "PATCH" || method === "PUT") &&
    segments[0] === "categories" &&
    segments[1] &&
    segments.length === 2
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    const body = (await req.json()) as {
      name?: string;
      name_ar?: string;
      alias?: string;
    };
    const store = loadStore();
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const cur = store.categories[idx];
    const newAlias = body.alias
      ? slugifyAlias(body.alias, body.alias)
      : cur.alias;
    if (
      newAlias !== cur.alias &&
      store.categories.some((c) => c.alias === newAlias && c.id !== id)
    ) {
      return NextResponse.json(
        { errors: { alias: ["Alias already taken."] } },
        { status: 422 }
      );
    }
    const oldAlias = cur.alias;
    const next: MockStoredCategory = {
      ...cur,
      name: body.name != null ? String(body.name).trim() : cur.name,
      alias: newAlias,
    };
    if (body.name_ar !== undefined) {
      const t = String(body.name_ar).trim();
      if (t) next.name_ar = t;
      else delete next.name_ar;
    }
    store.categories[idx] = next;
    if (oldAlias !== next.alias) {
      store.products = store.products.map((p) =>
        p.category === oldAlias ? { ...p, category: next.alias } : p
      );
    }
    saveStore(store);
    return NextResponse.json({ data: formatCategoryRow(next) });
  }

  if (method === "DELETE" && segments[0] === "categories" && segments[1] && segments.length === 2) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    const store = loadStore();
    const cat = store.categories.find((c) => c.id === id);
    if (!cat) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (store.products.some((p) => p.category === cat.alias)) {
      return NextResponse.json(
        {
          message:
            "Cannot delete: products still use this category. Reassign or delete them first.",
        },
        { status: 409 }
      );
    }
    if (store.categories.length <= 1) {
      return NextResponse.json(
        { message: "At least one category must remain." },
        { status: 409 }
      );
    }
    store.categories = store.categories.filter((c) => c.id !== id);
    saveStore(store);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (method === "GET" && segments[0] === "storage-files" && segments.length === 1) {
    const type = sp.get("type");
    const count = type === "banner" ? 3 : 1;
    const nowIso = new Date().toISOString();
    return NextResponse.json({
      data: Array.from({ length: count }).map((_, idx) => ({
        id: idx + 1,
        type: type ?? "banner",
        size: "0",
        public_id: `${type ?? "banner"}-${idx + 1}`,
        image_url: "/images/La dolce casa.svg",
        created_at: nowIso,
        updated_at: nowIso,
      })),
    });
  }

  if (method === "GET" && segments[0] === "products" && segments.length === 1) {
    const store = loadStore();
    const category = sp.get("category");
    return NextResponse.json(
      getProductsPayload(store.products, store.categories, category)
    );
  }

  if (method === "GET" && segments[0] === "users" && segments.length === 1) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const store = loadStore();
    return NextResponse.json({
      data: store.users.map((u) => toApiUser(u)),
    });
  }

  if (method === "GET" && segments[0] === "users" && segments[1] && segments.length === 2) {
    const id = Number(segments[1]);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    if (!canAccessUser(session, id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const store = loadStore();
    const u = store.users.find((x) => x.id === id);
    if (!u) {
      return NextResponse.json(
        { statusCode: 404, message: "Not found", error: "Not Found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: toApiUser(u) as ApiUser });
  }

  if (
    (method === "PATCH" || method === "PUT") &&
    segments[0] === "users" &&
    segments[1] &&
    segments.length === 2
  ) {
    const id = Number(segments[1]);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    if (!canAccessUser(session, id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const body = (await req.json()) as Record<string, unknown>;
    const store = loadStore();
    const idx = store.users.findIndex((x) => x.id === id);
    if (idx === -1) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const cur = store.users[idx];
    const newEmail = body.email != null ? String(body.email).trim() : cur.email;
    if (
      newEmail.toLowerCase() !== cur.email.toLowerCase() &&
      store.users.some(
        (u, i) =>
          i !== idx && u.email.toLowerCase() === newEmail.toLowerCase()
      )
    ) {
      return NextResponse.json(
        { errors: { email: ["The email has already been taken."] } },
        { status: 422 }
      );
    }
    const pwd = body.password != null ? String(body.password) : "";
    const next: MockStoredUser = {
      ...cur,
      first_name:
        body.first_name != null ? String(body.first_name) : cur.first_name,
      last_name: body.last_name != null ? String(body.last_name) : cur.last_name,
      email: newEmail,
      phone: body.phone != null ? String(body.phone) : cur.phone,
      password: pwd.trim() !== "" ? pwd : cur.password,
      role:
        sessionRole(session) === "admin" && body.role !== undefined
          ? String(body.role)
          : cur.role,
    };
    store.users[idx] = next;
    saveStore(store);
    return NextResponse.json({ data: toApiUser(next) as ApiUser });
  }

  if (method === "POST" && segments[0] === "auth" && segments[1] === "login") {
    const body = await req.json();
    const store = loadStore();
    const u = store.users.find(
      (x) => x.email.toLowerCase() === String(body.email ?? "").toLowerCase()
    );
    if (!u || u.password !== body.password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
    return NextResponse.json(buildLoginResponse(u));
  }

  if (method === "POST" && segments[0] === "users" && segments.length === 1) {
    const body = (await req.json()) as Record<string, unknown>;
    const store = loadStore();
    const email = String(body.email ?? "").trim();
    if (
      store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())
    ) {
      return NextResponse.json(
        { errors: { email: ["The email has already been taken."] } },
        { status: 422 }
      );
    }
    const rowId = store.nextUserId++;
    const row: MockStoredUser = {
      id: rowId,
      first_name: String(body.first_name ?? ""),
      last_name: String(body.last_name ?? ""),
      email,
      phone: String(body.phone ?? ""),
      password: String(body.password ?? ""),
      role: String(body.role ?? "user"),
    };
    store.users.push(row);
    saveStore(store);
    return NextResponse.json({ data: toApiUser(row) as ApiUser }, { status: 201 });
  }

  if (method === "POST" && segments[0] === "products" && segments.length === 1) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const body = (await req.json()) as Partial<MockStoredProduct> & {
      image_url?: string;
    };
    const store = loadStore();
    const catAlias = String(body.category ?? "others");
    if (!store.categories.some((c) => c.alias === catAlias)) {
      return NextResponse.json(
        { message: `Unknown category alias: ${catAlias}` },
        { status: 422 }
      );
    }
    const id = store.nextProductId++;
    const img =
      body.image_url != null && String(body.image_url).trim() !== ""
        ? String(body.image_url).trim()
        : undefined;
    const nameArRaw =
      body.name_ar != null ? String(body.name_ar).trim() : "";
    const descArRaw =
      body.descriptions_ar != null
        ? String(body.descriptions_ar).trim()
        : "";
    const row: MockStoredProduct = {
      id,
      name: String(body.name ?? "New product"),
      price: Number(body.price ?? 0),
      category: catAlias,
      descriptions: body.descriptions ? String(body.descriptions) : undefined,
      image_url: img,
      ...(nameArRaw ? { name_ar: nameArRaw } : {}),
      ...(descArRaw ? { descriptions_ar: descArRaw } : {}),
    };
    store.products.push(row);
    saveStore(store);
    return NextResponse.json({
      data: formatProductRow(row, store.categories),
    }, { status: 201 });
  }

  if (
    (method === "PATCH" || method === "PUT") &&
    segments[0] === "products" &&
    segments[1] &&
    segments.length === 2
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    const body = (await req.json()) as Partial<MockStoredProduct>;
    const store = loadStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const cur = store.products[idx];
    const nextCat =
      body.category != null ? String(body.category) : cur.category;
    if (!store.categories.some((c) => c.alias === nextCat)) {
      return NextResponse.json(
        { message: `Unknown category alias: ${nextCat}` },
        { status: 422 }
      );
    }
    const next: MockStoredProduct = {
      ...cur,
      name: body.name != null ? String(body.name) : cur.name,
      price: body.price != null ? Number(body.price) : cur.price,
      category: nextCat,
      descriptions:
        body.descriptions !== undefined
          ? String(body.descriptions)
          : cur.descriptions,
    };
    if (body.name_ar !== undefined) {
      const t = String(body.name_ar).trim();
      if (t) next.name_ar = t;
      else delete next.name_ar;
    }
    if (body.descriptions_ar !== undefined) {
      const t = String(body.descriptions_ar).trim();
      if (t) next.descriptions_ar = t;
      else delete next.descriptions_ar;
    }
    if (body.image_url !== undefined) {
      const trimmed = String(body.image_url).trim();
      if (trimmed === "") {
        tryRemoveUploadedImage(cur.image_url);
        delete next.image_url;
      } else {
        if (trimmed !== cur.image_url) {
          tryRemoveUploadedImage(cur.image_url);
        }
        next.image_url = trimmed;
      }
    }
    store.products[idx] = next;
    saveStore(store);
    return NextResponse.json({ data: formatProductRow(next, store.categories) });
  }

  if (method === "DELETE" && segments[0] === "products" && segments[1] && segments.length === 2) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    const store = loadStore();
    const victim = store.products.find((p) => p.id === id);
    const before = store.products.length;
    store.products = store.products.filter((p) => p.id !== id);
    if (store.products.length === before) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (victim?.image_url) tryRemoveUploadedImage(victim.image_url);
    saveStore(store);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (
    method === "GET" &&
    segments[0] === "hero-image-candidates" &&
    segments.length === 1
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const store = loadStore();
    return NextResponse.json({ data: heroImageCandidates(store) });
  }

  if (method === "GET" && segments[0] === "hero-slides" && segments.length === 1) {
    const store = loadStore();
    const sorted = [...store.heroSlides].sort(
      (a, b) => a.sort_order - b.sort_order || a.id - b.id
    );
    return NextResponse.json({ data: sorted });
  }

  if (method === "POST" && segments[0] === "hero-slides" && segments.length === 1) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const body = (await req.json()) as {
      image_url?: string;
      sort_order?: number;
    };
    const url = String(body.image_url ?? "").trim();
    if (!url) {
      return NextResponse.json(
        { message: "image_url is required" },
        { status: 422 }
      );
    }
    const store = loadStore();
    const row: MockStoredHeroSlide = {
      id: store.nextHeroSlideId++,
      image_url: url,
      sort_order:
        body.sort_order != null ? Number(body.sort_order) : store.heroSlides.length,
    };
    store.heroSlides.push(row);
    saveStore(store);
    return NextResponse.json({ data: row }, { status: 201 });
  }

  if (
    (method === "PATCH" || method === "PUT") &&
    segments[0] === "hero-slides" &&
    segments[1] &&
    segments.length === 2
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    const body = (await req.json()) as Partial<MockStoredHeroSlide>;
    const store = loadStore();
    const idx = store.heroSlides.findIndex((h) => h.id === id);
    if (idx === -1) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const cur = store.heroSlides[idx];
    const next: MockStoredHeroSlide = {
      ...cur,
      image_url:
        body.image_url != null
          ? String(body.image_url).trim()
          : cur.image_url,
      sort_order:
        body.sort_order != null ? Number(body.sort_order) : cur.sort_order,
    };
    store.heroSlides[idx] = next;
    saveStore(store);
    return NextResponse.json({ data: next });
  }

  if (
    method === "DELETE" &&
    segments[0] === "hero-slides" &&
    segments[1] &&
    segments.length === 2
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    const store = loadStore();
    const before = store.heroSlides.length;
    store.heroSlides = store.heroSlides.filter((h) => h.id !== id);
    if (store.heroSlides.length === before) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    saveStore(store);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (method === "GET" && segments[0] === "showrooms" && segments.length === 1) {
    const store = loadStore();
    const sorted = [...store.showrooms].sort(
      (a, b) => a.sort_order - b.sort_order || a.id - b.id
    );
    return NextResponse.json({ data: sorted.map(formatShowroomRow) });
  }

  if (method === "GET" && segments[0] === "projects" && segments.length === 1) {
    const store = loadStore();
    const sorted = [...store.projects].sort(
      (a, b) => a.sort_order - b.sort_order || a.id - b.id
    );
    return NextResponse.json({ data: sorted.map(formatProjectRow) });
  }

  if (method === "POST" && segments[0] === "showrooms" && segments.length === 1) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const body = (await req.json()) as Partial<MockStoredShowroom>;
    const store = loadStore();
    const images = normalizeShowroomImages(body);
    const row: MockStoredShowroom = {
      id: store.nextShowroomId++,
      name: String(body.name ?? "Showroom").trim() || "Showroom",
      name_ar: body.name_ar ? String(body.name_ar).trim() : undefined,
      city: body.city ? String(body.city).trim() : undefined,
      city_ar: body.city_ar ? String(body.city_ar).trim() : undefined,
      address: body.address ? String(body.address).trim() : undefined,
      address_ar: body.address_ar ? String(body.address_ar).trim() : undefined,
      description: body.description ? String(body.description).trim() : undefined,
      description_ar: body.description_ar
        ? String(body.description_ar).trim()
        : undefined,
      images,
      image_url: images[0],
      sort_order:
        body.sort_order != null
          ? Number(body.sort_order)
          : store.showrooms.length,
    };
    store.showrooms.push(row);
    saveStore(store);
    return NextResponse.json({ data: formatShowroomRow(row) }, { status: 201 });
  }

  if (method === "POST" && segments[0] === "projects" && segments.length === 1) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const body = (await req.json()) as Partial<MockStoredProject>;
    const store = loadStore();
    const images = normalizeProjectImages(body);
    const row: MockStoredProject = {
      id: store.nextProjectId++,
      name: String(body.name ?? "Project").trim() || "Project",
      name_ar: body.name_ar ? String(body.name_ar).trim() : undefined,
      city: body.city ? String(body.city).trim() : undefined,
      city_ar: body.city_ar ? String(body.city_ar).trim() : undefined,
      address: body.address ? String(body.address).trim() : undefined,
      address_ar: body.address_ar ? String(body.address_ar).trim() : undefined,
      description: body.description ? String(body.description).trim() : undefined,
      description_ar: body.description_ar
        ? String(body.description_ar).trim()
        : undefined,
      images,
      image_url: images[0],
      sort_order:
        body.sort_order != null
          ? Number(body.sort_order)
          : store.projects.length,
    };
    store.projects.push(row);
    saveStore(store);
    return NextResponse.json({ data: formatProjectRow(row) }, { status: 201 });
  }

  if (
    (method === "PATCH" || method === "PUT") &&
    segments[0] === "showrooms" &&
    segments[1] &&
    segments.length === 2
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    const body = (await req.json()) as Partial<MockStoredShowroom>;
    const store = loadStore();
    const idx = store.showrooms.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const cur = store.showrooms[idx];
    const prevImages =
      Array.isArray(cur.images) && cur.images.length > 0
        ? cur.images
        : cur.image_url?.trim()
          ? [cur.image_url.trim()]
          : [];
    const nextImages =
      body.images !== undefined || body.image_url !== undefined
        ? normalizeShowroomImages(body)
        : prevImages;
    const next: MockStoredShowroom = {
      ...cur,
      name: body.name != null ? String(body.name).trim() : cur.name,
      name_ar:
        body.name_ar !== undefined
          ? String(body.name_ar).trim() || undefined
          : cur.name_ar,
      city:
        body.city !== undefined
          ? String(body.city).trim() || undefined
          : cur.city,
      city_ar:
        body.city_ar !== undefined
          ? String(body.city_ar).trim() || undefined
          : cur.city_ar,
      address:
        body.address !== undefined
          ? String(body.address).trim() || undefined
          : cur.address,
      address_ar:
        body.address_ar !== undefined
          ? String(body.address_ar).trim() || undefined
          : cur.address_ar,
      description:
        body.description !== undefined
          ? String(body.description).trim() || undefined
          : cur.description,
      description_ar:
        body.description_ar !== undefined
          ? String(body.description_ar).trim() || undefined
          : cur.description_ar,
      images: nextImages,
      image_url: nextImages[0],
      sort_order:
        body.sort_order != null ? Number(body.sort_order) : cur.sort_order,
    };
    if (body.images !== undefined || body.image_url !== undefined) {
      removeUnusedUploadedImages(nextImages, prevImages);
    }
    store.showrooms[idx] = next;
    saveStore(store);
    return NextResponse.json({ data: formatShowroomRow(next) });
  }

  if (
    (method === "PATCH" || method === "PUT") &&
    segments[0] === "projects" &&
    segments[1] &&
    segments.length === 2
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    const body = (await req.json()) as Partial<MockStoredProject>;
    const store = loadStore();
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const cur = store.projects[idx];
    const prevImages =
      Array.isArray(cur.images) && cur.images.length > 0
        ? cur.images
        : cur.image_url?.trim()
          ? [cur.image_url.trim()]
          : [];
    const nextImages =
      body.images !== undefined || body.image_url !== undefined
        ? normalizeProjectImages(body)
        : prevImages;
    const next: MockStoredProject = {
      ...cur,
      name: body.name != null ? String(body.name).trim() : cur.name,
      name_ar:
        body.name_ar !== undefined
          ? String(body.name_ar).trim() || undefined
          : cur.name_ar,
      city:
        body.city !== undefined
          ? String(body.city).trim() || undefined
          : cur.city,
      city_ar:
        body.city_ar !== undefined
          ? String(body.city_ar).trim() || undefined
          : cur.city_ar,
      address:
        body.address !== undefined
          ? String(body.address).trim() || undefined
          : cur.address,
      address_ar:
        body.address_ar !== undefined
          ? String(body.address_ar).trim() || undefined
          : cur.address_ar,
      description:
        body.description !== undefined
          ? String(body.description).trim() || undefined
          : cur.description,
      description_ar:
        body.description_ar !== undefined
          ? String(body.description_ar).trim() || undefined
          : cur.description_ar,
      images: nextImages,
      image_url: nextImages[0],
      sort_order:
        body.sort_order != null ? Number(body.sort_order) : cur.sort_order,
    };
    if (body.images !== undefined || body.image_url !== undefined) {
      removeUnusedUploadedImages(nextImages, prevImages);
    }
    store.projects[idx] = next;
    saveStore(store);
    return NextResponse.json({ data: formatProjectRow(next) });
  }

  if (
    method === "DELETE" &&
    segments[0] === "showrooms" &&
    segments[1] &&
    segments.length === 2
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    const store = loadStore();
    const victim = store.showrooms.find((s) => s.id === id);
    const before = store.showrooms.length;
    store.showrooms = store.showrooms.filter((s) => s.id !== id);
    if (store.showrooms.length === before) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (victim) {
      const victimImages =
        Array.isArray(victim.images) && victim.images.length > 0
          ? victim.images
          : victim.image_url?.trim()
            ? [victim.image_url.trim()]
            : [];
      removeUnusedUploadedImages([], victimImages);
    }
    saveStore(store);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (
    method === "DELETE" &&
    segments[0] === "projects" &&
    segments[1] &&
    segments.length === 2
  ) {
    if (sessionRole(session) !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const id = Number(segments[1]);
    const store = loadStore();
    const victim = store.projects.find((p) => p.id === id);
    const before = store.projects.length;
    store.projects = store.projects.filter((p) => p.id !== id);
    if (store.projects.length === before) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (victim) {
      const victimImages =
        Array.isArray(victim.images) && victim.images.length > 0
          ? victim.images
          : victim.image_url?.trim()
            ? [victim.image_url.trim()]
            : [];
      removeUnusedUploadedImages([], victimImages);
    }
    saveStore(store);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return null;
}

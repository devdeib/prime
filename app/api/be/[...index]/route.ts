import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function slugifyAlias(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'category'
}

async function ensureUniqueCategoryAlias(alias: string, excludeId?: string) {
  let candidate = alias
  let suffix = 2
  while (true) {
    let query = supabase.from('categories').select('id').eq('alias', candidate)
    if (excludeId) query = query.neq('id', excludeId)
    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) return candidate
    candidate = `${alias}-${suffix++}`
  }
}

function normalizeImageUrl(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeVideoUrl(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeImageList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function normalizeShowroomPayload(body: Record<string, unknown>) {
  const images = normalizeImageList(body.images)
  const fallbackImageUrl = normalizeImageUrl(body.image_url)
  const normalizedImages =
    images.length > 0 ? images : fallbackImageUrl ? [fallbackImageUrl] : []
  const leadImageUrl = normalizedImages[0] ?? null
  return { ...body, images: normalizedImages, image_url: leadImageUrl }
}

function formatShowroomRow(row: Record<string, unknown>) {
  const images = normalizeImageList(row.images)
  const imageUrl = images[0] ?? normalizeImageUrl(row.image_url)
  return {
    ...row,
    images: imageUrl && images.length === 0 ? [imageUrl] : images,
    image_url: imageUrl,
  }
}

function normalizeProjectPayload(body: Record<string, unknown>) {
  const images = normalizeImageList(body.images)
  const fallbackImageUrl = normalizeImageUrl(body.image_url)
  const normalizedImages =
    images.length > 0 ? images : fallbackImageUrl ? [fallbackImageUrl] : []
  const leadImageUrl = normalizedImages[0] ?? null
  return { ...body, images: normalizedImages, image_url: leadImageUrl }
}

function formatProjectRow(row: Record<string, unknown>) {
  const images = normalizeImageList(row.images)
  const imageUrl = images[0] ?? normalizeImageUrl(row.image_url)
  return {
    ...row,
    images: imageUrl && images.length === 0 ? [imageUrl] : images,
    image_url: imageUrl,
  }
}

function formatProductRow(row: Record<string, unknown>) {
  const imageUrl = normalizeImageUrl(row.image_url)
  const videoUrl = normalizeVideoUrl(row.video_url)
  const externalUrl =
    typeof row.external_url === 'string' && row.external_url.trim()
      ? row.external_url.trim()
      : null
  return {
    ...row,
    image_url: imageUrl,
    video_url: videoUrl,
    external_url: externalUrl,
    storage_files: imageUrl
      ? [{ id: row.id, type: 'product', image_url: imageUrl }]
      : [],
  }
}

const DEFAULT_SITE_CONTENT: Record<string, unknown> = {
  about: {
    eyebrow_en: 'Our Story',
    eyebrow_ar: '',
    title_en: 'About La Dolce Casa',
    title_ar: '',
    body_en:
      'La Dolce Casa creates curated furniture experiences for homes, showrooms, and refined interior projects. Our work brings together quality materials, thoughtful detailing, and a warm sense of living.',
    body_ar: '',
    image_url: '',
  },
  services: {
    eyebrow_en: 'Services',
    eyebrow_ar: '',
    title_en: 'Interior Services',
    title_ar: '',
    body_en:
      'From furniture selection to showroom consultation and project support, our team helps shape complete interiors with practical guidance and a refined visual direction.',
    body_ar: '',
    image_url: '',
  },
  contact: {
    title_en: 'CONTACT',
    title_ar: '',
    headquarters_en: 'HEADQUARTERS',
    headquarters_ar: '',
    headquarters_value_en: 'Rome, Italy',
    headquarters_value_ar: '',
    phone_label_en: 'PHONE NUMBER',
    phone_label_ar: '',
    phone_value_en: '+39 998 656 6333 44',
    phone_value_ar: '',
    email_label_en: 'EMAIL',
    email_label_ar: '',
    email_value_en: 'info@ladolcecasa.net',
    email_value_ar: '',
    hours_label_en: 'OPENING HOURS',
    hours_label_ar: '',
    hours_value_en: 'Monday - Friday: 09:30 - 19:00\nSaturday: 10:00 - 17:00',
    hours_value_ar: '',
    map_embed_url: '',
  },
  footer_socials: {
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
  },
}

function sanitizeSiteContentKey(key: string | undefined) {
  return key && Object.prototype.hasOwnProperty.call(DEFAULT_SITE_CONTENT, key)
    ? key
    : null
}

async function readSiteContent(key: string) {
  const fallback = DEFAULT_SITE_CONTENT[key] ?? {}
  const { data, error } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) return fallback
  if (!data || typeof data.value !== 'object' || data.value === null) return fallback
  return { ...(fallback as Record<string, unknown>), ...(data.value as Record<string, unknown>) }
}

async function getMediaCandidates() {
  const [productsRes, heroSlidesRes, showroomsRes, projectsRes] = await Promise.all([
    supabase.from('products').select('image_url'),
    supabase.from('hero_slides').select('image_url'),
    supabase.from('showrooms').select('image_url,images'),
    supabase.from('projects').select('image_url,images'),
  ])
  if (productsRes.error) throw productsRes.error
  if (heroSlidesRes.error) throw heroSlidesRes.error
  if (showroomsRes.error) throw showroomsRes.error
  if (projectsRes.error) throw projectsRes.error

  const urls = new Set<string>()
  for (const row of productsRes.data ?? []) {
    const imageUrl = normalizeImageUrl(row.image_url)
    if (imageUrl) urls.add(imageUrl)
  }
  for (const row of heroSlidesRes.data ?? []) {
    const imageUrl = normalizeImageUrl(row.image_url)
    if (imageUrl) urls.add(imageUrl)
  }
  for (const row of showroomsRes.data ?? []) {
    const images = normalizeImageList(row.images)
    for (const image of images) urls.add(image)
    const imageUrl = normalizeImageUrl(row.image_url)
    if (imageUrl) urls.add(imageUrl)
  }
  for (const row of projectsRes.data ?? []) {
    const images = normalizeImageList(row.images)
    for (const image of images) urls.add(image)
    const imageUrl = normalizeImageUrl(row.image_url)
    if (imageUrl) urls.add(imageUrl)
  }
  return Array.from(urls)
}

function buildStorageFileRows(type: string | null, urls: string[]) {
  const fallbackCount = type === 'banner' ? 3 : 1
  const selected =
    urls.length > 0
      ? type === 'banner'
        ? urls.slice(0, 3)
        : [urls[0]]
      : Array.from({ length: fallbackCount }, (_, index) =>
          `https://picsum.photos/seed/${type ?? 'banner'}-${index + 1}/1200/700`
        )
  return selected.map((image_url, index) => ({
    id: index + 1,
    type: type ?? 'banner',
    image_url,
  }))
}

export async function GET(req: NextRequest, context: { params: Promise<{ index: string[] }> }) {
  const { index } = await context.params
  const [resource] = index

  if (resource === 'categories') {
    const { data, error } = await supabase.from('categories').select('*')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'products') {
    const category = req.nextUrl.searchParams.get('category')
    let query = supabase.from('products').select('*')
    if (category) query = query.eq('category', category)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map((row) => formatProductRow(row)))
  }

  if (resource === 'site-content') {
    const [, key] = index
    if (key) {
      const normalizedKey = sanitizeSiteContentKey(key)
      if (!normalizedKey) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(await readSiteContent(normalizedKey))
    }

    const entries = await Promise.all(
      Object.keys(DEFAULT_SITE_CONTENT).map(async (contentKey) => [
        contentKey,
        await readSiteContent(contentKey),
      ])
    )
    return NextResponse.json(Object.fromEntries(entries))
  }

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').select('*').order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'home-hero') {
    const { data, error } = await supabase.from('hero_copy').select('*').eq('id', 1).single()
    if (error) return NextResponse.json({}, { status: 200 })
    return NextResponse.json(data)
  }

  if (resource === 'hero-image-candidates') {
    try {
      return NextResponse.json(await getMediaCandidates())
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to load image candidates' },
        { status: 500 }
      )
    }
  }

  if (resource === 'showrooms') {
    const { data, error } = await supabase.from('showrooms').select('*').order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map((row) => formatShowroomRow(row)))
  }

  if (resource === 'projects') {
    const { data, error } = await supabase.from('projects').select('*').order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map((row) => formatProjectRow(row)))
  }

  if (resource === 'storage-files') {
    try {
      const type = req.nextUrl.searchParams.get('type')
      const candidates = await getMediaCandidates()
      return NextResponse.json(buildStorageFileRows(type, candidates))
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to load storage files' },
        { status: 500 }
      )
    }
  }

  if (resource === 'users') {
    const { data, error } = await supabase.from('users').select('*')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(req: NextRequest, context: { params: Promise<{ index: string[] }> }) {
  const { index } = await context.params
  const [resource] = index
  const body = await req.json()

  if (resource === 'products') {
    const payload = {
      ...body,
      external_url:
        typeof body.external_url === 'string' && body.external_url.trim()
          ? body.external_url.trim()
          : null,
      video_url:
        typeof body.video_url === 'string' && body.video_url.trim()
          ? body.video_url.trim()
          : null,
    }
    const { data, error } = await supabase.from('products').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatProductRow(data))
  }

  if (resource === 'categories') {
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'New category'
    const aliasBase = slugifyAlias(
      typeof body.alias === 'string' && body.alias.trim() ? body.alias : name
    )
    const alias = await ensureUniqueCategoryAlias(aliasBase)
    const payload = { ...body, name, alias }
    const { data, error } = await supabase.from('categories').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'home-hero') {
    const { data, error } = await supabase
      .from('hero_copy')
      .update(body)
      .eq('id', 1)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'showrooms') {
    const payload = normalizeShowroomPayload(body)
    const { data, error } = await supabase.from('showrooms').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatShowroomRow(data))
  }

  if (resource === 'projects') {
    const payload = normalizeProjectPayload(body)
    const { data, error } = await supabase.from('projects').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatProjectRow(data))
  }

  if (resource === 'users') {
    const { data, error } = await supabase.from('users').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(req: NextRequest, context: { params: Promise<{ index: string[] }> }) {
  const { index } = await context.params
  const [resource, id] = index
  const body = await req.json()

  if (resource === 'products') {
    const payload = {
      ...body,
      external_url:
        typeof body.external_url === 'string' && body.external_url.trim()
          ? body.external_url.trim()
          : null,
      video_url:
        typeof body.video_url === 'string' && body.video_url.trim()
          ? body.video_url.trim()
          : null,
    }
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatProductRow(data))
  }

  if (resource === 'site-content') {
    const normalizedKey = sanitizeSiteContentKey(id)
    if (!normalizedKey) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data, error } = await supabase
      .from('site_content')
      .upsert({ key: normalizedKey, value: body }, { onConflict: 'key' })
      .select('value')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data.value)
  }

  if (resource === 'categories') {
    const currentName =
      typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'category'
    const aliasBase = slugifyAlias(
      typeof body.alias === 'string' && body.alias.trim() ? body.alias : currentName
    )
    const alias = await ensureUniqueCategoryAlias(aliasBase, id)
    const payload = { ...body, name: currentName, alias }
    const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'home-hero') {
    const { data, error } = await supabase
      .from('hero_copy')
      .update(body)
      .eq('id', 1)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'showrooms') {
    const payload = normalizeShowroomPayload(body)
    const { data, error } = await supabase.from('showrooms').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatShowroomRow(data))
  }

  if (resource === 'projects') {
    const payload = normalizeProjectPayload(body)
    const { data, error } = await supabase.from('projects').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatProjectRow(data))
  }

  if (resource === 'users') {
    const { data, error } = await supabase.from('users').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ index: string[] }> }) {
  const { index } = await context.params
  const [resource, id] = index

  if (resource === 'products') {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (resource === 'categories') {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (resource === 'hero-slides') {
    const { error } = await supabase.from('hero_slides').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (resource === 'showrooms') {
    const { error } = await supabase.from('showrooms').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (resource === 'projects') {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (resource === 'users') {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

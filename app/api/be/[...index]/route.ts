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

  return {
    ...body,
    images: normalizedImages,
    image_url: leadImageUrl,
  }
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

function formatProductRow(row: Record<string, unknown>) {
  const imageUrl = normalizeImageUrl(row.image_url)

  return {
    ...row,
    image_url: imageUrl,
    storage_files: imageUrl
      ? [{ id: row.id, type: 'product', image_url: imageUrl }]
      : [],
  }
}

async function getMediaCandidates() {
  const [productsRes, heroSlidesRes, showroomsRes] = await Promise.all([
    supabase.from('products').select('image_url'),
    supabase.from('hero_slides').select('image_url'),
    supabase.from('showrooms').select('image_url,images'),
  ])

  if (productsRes.error) throw productsRes.error
  if (heroSlidesRes.error) throw heroSlidesRes.error
  if (showroomsRes.error) throw showroomsRes.error

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
  const [resource, id] = index

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

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').select('*').order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
    const { data, error } = await supabase.from('products').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatProductRow(data))
  }

  if (resource === 'categories') {
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'New category'
    const aliasBase = slugifyAlias(
      typeof body.alias === 'string' && body.alias.trim() ? body.alias : name
    )
    const alias = await ensureUniqueCategoryAlias(aliasBase)
    const payload = {
      ...body,
      name,
      alias,
    }

    const { data, error } = await supabase.from('categories').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'showrooms') {
    const payload = normalizeShowroomPayload(body)
    const { data, error } = await supabase.from('showrooms').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatShowroomRow(data))
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
    const { data, error } = await supabase.from('products').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatProductRow(data))
  }

  if (resource === 'categories') {
    const currentName =
      typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'category'
    const aliasBase = slugifyAlias(
      typeof body.alias === 'string' && body.alias.trim() ? body.alias : currentName
    )
    const alias = await ensureUniqueCategoryAlias(aliasBase, id)
    const payload = {
      ...body,
      name: currentName,
      alias,
    }

    const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'showrooms') {
    const payload = normalizeShowroomPayload(body)
    const { data, error } = await supabase.from('showrooms').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatShowroomRow(data))
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

  if (resource === 'users') {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

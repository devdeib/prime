import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveGoogleMapsShortLinkToEmbedUrl, toEmbedUrl } from '@/lib/map-embed-url'
import {
  generateSlotsForDate,
  getMonthAvailability,
  getTodayDateKey,
  groupBookedTimesByDate,
  isValidBookingPayload,
  type VipMeetingRow,
} from '@/lib/vip-meetings'
import { requireAdminSession } from '@/lib/vip-meetings-auth'
import { normalizeVipMeetingSettings } from '@/lib/vip-meeting-settings'
import { readVipMeetingSettings, writeVipMeetingSettings } from '@/lib/vip-meeting-settings-db'

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
    stat_primary_value_en: 'Since 2014',
    stat_primary_value_ar: '',
    stat_primary_label_en: 'A legacy of refined interiors',
    stat_primary_label_ar: '',
    stat_1_value_en: '120+',
    stat_1_value_ar: '',
    stat_1_label_en: 'Handed projects',
    stat_1_label_ar: '',
    stat_2_value_en: '300+',
    stat_2_value_ar: '',
    stat_2_label_en: 'Happy customers',
    stat_2_label_ar: '',
    stat_3_value_en: '24/7',
    stat_3_value_ar: '',
    stat_3_label_en: 'Consultation support',
    stat_3_label_ar: '',
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
    stat_primary_value_en: 'Premium',
    stat_primary_value_ar: '',
    stat_primary_label_en: 'End-to-end service experience',
    stat_primary_label_ar: '',
    stat_1_value_en: '48h',
    stat_1_value_ar: '',
    stat_1_label_en: 'Proposal turnaround',
    stat_1_label_ar: '',
    stat_2_value_en: '1:1',
    stat_2_value_ar: '',
    stat_2_label_en: 'Design guidance',
    stat_2_label_ar: '',
    stat_3_value_en: '100%',
    stat_3_value_ar: '',
    stat_3_label_en: 'Material-focused selection',
    stat_3_label_ar: '',
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
    snapchat: '',
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
  const merged = {
    ...(fallback as Record<string, unknown>),
    ...(data.value as Record<string, unknown>),
  }

  if (key !== 'contact') return merged

  const raw = typeof merged.map_embed_url === 'string' ? merged.map_embed_url.trim() : ''
  if (!raw) return merged

  const direct = toEmbedUrl(raw)
  if (direct) {
    return { ...merged, map_iframe_src: direct }
  }
  const resolved = await resolveGoogleMapsShortLinkToEmbedUrl(raw)
  if (resolved) {
    return { ...merged, map_iframe_src: resolved }
  }
  return merged
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

async function fetchActiveVipMeetings(from?: string, to?: string) {
  let query = supabase
    .from('vip_meetings')
    .select('*')
    .neq('status', 'cancelled')
    .order('scheduled_at', { ascending: true })

  if (from) query = query.gte('scheduled_at', from)
  if (to) query = query.lte('scheduled_at', to)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as VipMeetingRow[]
}

async function handleVipMeetingsGet(req: NextRequest, index: string[]) {
  const [, segment] = index

  if (segment === 'today') {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = getTodayDateKey()
    const start = `${today}T00:00:00.000`
    const end = `${today}T23:59:59.999`
    try {
      const rows = await fetchActiveVipMeetings(start, end)
      return NextResponse.json(rows)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to load meetings' },
        { status: 500 }
      )
    }
  }

  const month = req.nextUrl.searchParams.get('month')
  const date = req.nextUrl.searchParams.get('date')

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yearStr, monthStr] = month.split('-')
    const year = Number(yearStr)
    const monthNum = Number(monthStr)
    const rangeStart = `${month}-01T00:00:00.000`
    const lastDay = new Date(year, monthNum, 0).getDate()
    const rangeEnd = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999`
    try {
      const settings = await readVipMeetingSettings(supabase)
      const rows = await fetchActiveVipMeetings(rangeStart, rangeEnd)
      const bookedByDate = groupBookedTimesByDate(rows)
      const availability = getMonthAvailability(year, monthNum, bookedByDate, settings)
      return NextResponse.json({ month, availability, settings })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to load availability' },
        { status: 500 }
      )
    }
  }

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const rangeStart = `${date}T00:00:00.000`
    const rangeEnd = `${date}T23:59:59.999`
    try {
      const settings = await readVipMeetingSettings(supabase)
      const rows = await fetchActiveVipMeetings(rangeStart, rangeEnd)
      const bookedByDate = groupBookedTimesByDate(rows)
      const booked = bookedByDate[date] ?? new Set()
      const slots = generateSlotsForDate(date, booked, settings)
      return NextResponse.json({ date, slots })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to load slots' },
        { status: 500 }
      )
    }
  }

  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('vip_meetings')
      .select('*')
      .order('scheduled_at', { ascending: true })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load meetings' },
      { status: 500 }
    )
  }
}

function buildStorageFileRows(type: string | null, urls: string[]) {
  const fallbackCount = type === 'banner' ? 3 : 1
  const selected =
    urls.length > 0
      ? type === 'banner'
        ? urls.slice(0, 3)
        : [urls[0]]
      : []
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
    const [, id] = index
    if (id) {
      const { data, error } = await supabase
        .from('showrooms')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(formatShowroomRow(data))
    }
    const { data, error } = await supabase.from('showrooms').select('*').order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).map((row) => formatShowroomRow(row)))
  }

  if (resource === 'projects') {
    const [, id] = index
    if (id) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(formatProjectRow(data))
    }
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

  if (resource === 'vip-meetings') {
    return handleVipMeetingsGet(req, index)
  }

  if (resource === 'vip-meeting-settings') {
    try {
      const settings = await readVipMeetingSettings(supabase)
      return NextResponse.json(settings)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to load settings' },
        { status: 500 }
      )
    }
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

  if (resource === 'vip-meetings') {
    try {
      const settings = await readVipMeetingSettings(supabase)
      const dateStr = typeof body.date === 'string' ? body.date.trim() : ''
      const rangeStart = `${dateStr}T00:00:00.000`
      const rangeEnd = `${dateStr}T23:59:59.999`
      const rows = dateStr ? await fetchActiveVipMeetings(rangeStart, rangeEnd) : []
      const bookedByDate = groupBookedTimesByDate(rows)
      const booked = bookedByDate[dateStr] ?? new Set()
      const validation = isValidBookingPayload(body, settings, booked)
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
      const { data, error } = await supabase
      .from('vip_meetings')
      .insert([validation.payload])
      .select()
      .single()
      if (error) {
        const message =
          error.code === '23505'
            ? 'This time slot is no longer available.'
            : error.message
        return NextResponse.json({ error: message }, { status: 500 })
      }
      return NextResponse.json(data)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create booking' },
        { status: 500 }
      )
    }
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
    let value: Record<string, unknown> = body
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const { map_iframe_src: _computedEmbed, ...rest } = value
      value = rest
    }
    const { data, error } = await supabase
      .from('site_content')
      .upsert({ key: normalizedKey, value }, { onConflict: 'key' })
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

  if (resource === 'vip-meetings') {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const status =
      typeof body.status === 'string' && ['pending', 'confirmed', 'cancelled'].includes(body.status)
        ? body.status
        : null
    if (!status) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    const { data, error } = await supabase
      .from('vip_meetings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'vip-meeting-settings') {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
      const settings = await writeVipMeetingSettings(
        supabase,
        normalizeVipMeetingSettings(body)
      )
      return NextResponse.json(settings)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to save settings' },
        { status: 500 }
      )
    }
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

  if (resource === 'vip-meetings') {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await supabase
      .from('vip_meetings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

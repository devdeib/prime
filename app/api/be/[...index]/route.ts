import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    return NextResponse.json(data)
  }

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').select('*').order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'showrooms') {
    const { data, error } = await supabase.from('showrooms').select('*').order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
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
    return NextResponse.json(data)
  }

  if (resource === 'categories') {
    const { data, error } = await supabase.from('categories').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'showrooms') {
    const { data, error } = await supabase.from('showrooms').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
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
    return NextResponse.json(data)
  }

  if (resource === 'categories') {
    const { data, error } = await supabase.from('categories').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'hero-slides') {
    const { data, error } = await supabase.from('hero_slides').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (resource === 'showrooms') {
    const { data, error } = await supabase.from('showrooms').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
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
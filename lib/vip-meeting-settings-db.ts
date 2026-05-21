import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  DEFAULT_VIP_MEETING_SETTINGS,
  normalizeVipMeetingSettings,
  type VipMeetingSettings,
} from '@/lib/vip-meeting-settings'

export async function readVipMeetingSettings(
  client: SupabaseClient
): Promise<VipMeetingSettings> {
  const { data, error } = await client
    .from('vip_meeting_settings')
    .select('settings')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data?.settings) return DEFAULT_VIP_MEETING_SETTINGS
  return normalizeVipMeetingSettings(data.settings)
}

export async function writeVipMeetingSettings(
  client: SupabaseClient,
  settings: VipMeetingSettings
) {
  const normalized = normalizeVipMeetingSettings(settings)
  const { data, error } = await client
    .from('vip_meeting_settings')
    .upsert({ id: 1, settings: normalized }, { onConflict: 'id' })
    .select('settings')
    .single()

  if (error) throw error
  return normalizeVipMeetingSettings(data.settings)
}

export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

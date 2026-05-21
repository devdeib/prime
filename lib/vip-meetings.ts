import {
  getDayScheduleForDate,
  isDateBlocked,
  parseTimeToMinutes,
  type VipMeetingSettings,
} from '@/lib/vip-meeting-settings'
import { DEFAULT_VIP_MEETING_SETTINGS } from '@/lib/vip-meeting-settings'

export const VIP_BOOKING_HORIZON_DAYS = DEFAULT_VIP_MEETING_SETTINGS.booking_horizon_days

export type VipMeetingRow = {
  id: number
  guest_name: string
  guest_email: string
  guest_phone: string | null
  notes: string | null
  scheduled_at: string
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at?: string
}

function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatSlotTime(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function buildScheduledAtIso(dateStr: string, timeStr: string) {
  const { year, month, day } = parseDateParts(dateStr)
  const [hour, minute] = timeStr.split(':').map(Number)
  const local = new Date(year, month, day, hour, minute, 0, 0)
  return local.toISOString()
}

export function extractDateAndTime(scheduledAt: string) {
  const date = new Date(scheduledAt)
  const dateStr = toDateKey(date)
  const timeStr = formatSlotTime(date.getHours() * 60 + date.getMinutes())
  return { dateStr, timeStr }
}

export function generateSlotsForDate(
  dateStr: string,
  bookedTimes: Set<string> = new Set(),
  settings: VipMeetingSettings = DEFAULT_VIP_MEETING_SETTINGS
) {
  if (isDateBlocked(dateStr, settings)) return []

  const schedule = getDayScheduleForDate(dateStr, settings)
  if (!schedule.enabled) return []

  const start = parseTimeToMinutes(schedule.start)
  const end = parseTimeToMinutes(schedule.end)
  const duration = settings.slot_duration_minutes
  const lastStart = end - duration
  if (lastStart < start) return []

  const slots: { time: string; label: string; available: boolean }[] = []
  const now = new Date()
  const todayKey = toDateKey(now)
  const isToday = dateStr === todayKey
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (let m = start; m <= lastStart; m += duration) {
    const time = formatSlotTime(m)
    const past = isToday && m <= nowMinutes
    const booked = bookedTimes.has(time)
    slots.push({
      time,
      label: time,
      available: !past && !booked,
    })
  }

  return slots
}

export function dateHasAvailability(
  dateStr: string,
  bookedTimes: Set<string> = new Set(),
  settings: VipMeetingSettings = DEFAULT_VIP_MEETING_SETTINGS
) {
  return generateSlotsForDate(dateStr, bookedTimes, settings).some((slot) => slot.available)
}

export function getMonthAvailability(
  year: number,
  month: number,
  bookedByDate: Record<string, Set<string>> = {},
  settings: VipMeetingSettings = DEFAULT_VIP_MEETING_SETTINGS
) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const availability: Record<string, boolean> = {}
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const booked = bookedByDate[dateStr] ?? new Set()
    availability[dateStr] = dateHasAvailability(dateStr, booked, settings)
  }
  return availability
}

export function groupBookedTimesByDate(rows: VipMeetingRow[]) {
  const map: Record<string, Set<string>> = {}
  for (const row of rows) {
    if (row.status === 'cancelled') continue
    const { dateStr, timeStr } = extractDateAndTime(row.scheduled_at)
    if (!map[dateStr]) map[dateStr] = new Set()
    map[dateStr].add(timeStr)
  }
  return map
}

export function isValidBookingPayload(
  body: Record<string, unknown>,
  settings: VipMeetingSettings = DEFAULT_VIP_MEETING_SETTINGS,
  bookedTimes: Set<string> = new Set()
) {
  const guestName = typeof body.guest_name === 'string' ? body.guest_name.trim() : ''
  const guestEmail = typeof body.guest_email === 'string' ? body.guest_email.trim() : ''
  const guestPhone = typeof body.guest_phone === 'string' ? body.guest_phone.trim() : ''
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
  const dateStr = typeof body.date === 'string' ? body.date.trim() : ''
  const timeStr = typeof body.time === 'string' ? body.time.trim() : ''

  if (!guestName || guestName.length < 2) return { ok: false as const, error: 'Name is required.' }
  if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return { ok: false as const, error: 'A valid email is required.' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { ok: false as const, error: 'Invalid date.' }
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return { ok: false as const, error: 'Invalid time.' }

  const slots = generateSlotsForDate(dateStr, bookedTimes, settings)
  const slot = slots.find((s) => s.time === timeStr)
  if (!slot?.available) return { ok: false as const, error: 'This time slot is no longer available.' }

  return {
    ok: true as const,
    payload: {
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone || null,
      notes: notes || null,
      scheduled_at: buildScheduledAtIso(dateStr, timeStr),
      status: 'pending' as const,
    },
  }
}

export function getTodayDateKey() {
  return toDateKey(new Date())
}

export function formatMeetingTime(scheduledAt: string, locale = 'en') {
  const date = new Date(scheduledAt)
  return date.toLocaleTimeString(locale === 'ar' ? 'ar' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMeetingDate(scheduledAt: string, locale = 'en') {
  const date = new Date(scheduledAt)
  return date.toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

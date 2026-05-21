export const VIP_SLOT_DURATION_MINUTES = 60
export const VIP_BOOKING_HORIZON_DAYS = 60

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

type DayHours = { startHour: number; startMinute: number; endHour: number; endMinute: number }

const WEEKDAY_HOURS: DayHours = { startHour: 9, startMinute: 30, endHour: 19, endMinute: 0 }
const SATURDAY_HOURS: DayHours = { startHour: 10, startMinute: 0, endHour: 17, endMinute: 0 }

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

function getDayHours(dateStr: string): DayHours | null {
  const { year, month, day } = parseDateParts(dateStr)
  const dow = new Date(year, month, day).getDay()
  if (dow === 0) return null
  if (dow === 6) return SATURDAY_HOURS
  return WEEKDAY_HOURS
}

function minutesFromMidnight(hour: number, minute: number) {
  return hour * 60 + minute
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

export function generateSlotsForDate(dateStr: string, bookedTimes: Set<string> = new Set()) {
  const hours = getDayHours(dateStr)
  if (!hours) return []

  const start = minutesFromMidnight(hours.startHour, hours.startMinute)
  const end = minutesFromMidnight(hours.endHour, hours.endMinute)
  const lastStart = end - VIP_SLOT_DURATION_MINUTES
  const slots: { time: string; label: string; available: boolean }[] = []

  const now = new Date()
  const todayKey = toDateKey(now)
  const isToday = dateStr === todayKey
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (let m = start; m <= lastStart; m += VIP_SLOT_DURATION_MINUTES) {
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

export function dateHasAvailability(dateStr: string, bookedTimes: Set<string> = new Set()) {
  return generateSlotsForDate(dateStr, bookedTimes).some((slot) => slot.available)
}

export function listBookableDateKeys(from = new Date(), horizonDays = VIP_BOOKING_HORIZON_DAYS) {
  const keys: string[] = []
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let i = 0; i < horizonDays; i++) {
    const key = toDateKey(cursor)
    if (dateHasAvailability(key)) keys.push(key)
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

export function getMonthAvailability(
  year: number,
  month: number,
  bookedByDate: Record<string, Set<string>> = {}
) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const availability: Record<string, boolean> = {}
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const booked = bookedByDate[dateStr] ?? new Set()
    availability[dateStr] = dateHasAvailability(dateStr, booked)
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

export function isValidBookingPayload(body: Record<string, unknown>) {
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

  const slots = generateSlotsForDate(dateStr)
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

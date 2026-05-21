export type DaySchedule = {
  enabled: boolean
  start: string
  end: string
}

export type VipMeetingSettings = {
  slot_duration_minutes: number
  booking_horizon_days: number
  weekly: Record<string, DaySchedule>
  blocked_dates: string[]
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export const DEFAULT_VIP_MEETING_SETTINGS: VipMeetingSettings = {
  slot_duration_minutes: 60,
  booking_horizon_days: 60,
  weekly: {
    '0': { enabled: false, start: '10:00', end: '17:00' },
    '1': { enabled: true, start: '09:30', end: '19:00' },
    '2': { enabled: true, start: '09:30', end: '19:00' },
    '3': { enabled: true, start: '09:30', end: '19:00' },
    '4': { enabled: true, start: '09:30', end: '19:00' },
    '5': { enabled: true, start: '09:30', end: '19:00' },
    '6': { enabled: true, start: '10:00', end: '17:00' },
  },
  blocked_dates: [],
}

function normalizeTime(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim().slice(0, 5)
  return TIME_RE.test(trimmed) ? trimmed : fallback
}

function normalizeDaySchedule(value: unknown, fallback: DaySchedule): DaySchedule {
  if (!value || typeof value !== 'object') return fallback
  const raw = value as Record<string, unknown>
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : fallback.enabled,
    start: normalizeTime(raw.start, fallback.start),
    end: normalizeTime(raw.end, fallback.end),
  }
}

function normalizeWeekly(value: unknown) {
  const weekly: Record<string, DaySchedule> = {}
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  for (let dow = 0; dow <= 6; dow++) {
    const key = String(dow)
    weekly[key] = normalizeDaySchedule(raw[key], DEFAULT_VIP_MEETING_SETTINGS.weekly[key])
  }
  return weekly
}

function normalizeBlockedDates(value: unknown) {
  if (!Array.isArray(value)) return []
  const dates = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
  return Array.from(new Set(dates)).sort()
}

export function normalizeVipMeetingSettings(value: unknown): VipMeetingSettings {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  const slotDuration =
    typeof raw.slot_duration_minutes === 'number' && raw.slot_duration_minutes >= 15
      ? Math.min(180, Math.round(raw.slot_duration_minutes))
      : DEFAULT_VIP_MEETING_SETTINGS.slot_duration_minutes
  const horizon =
    typeof raw.booking_horizon_days === 'number' && raw.booking_horizon_days >= 7
      ? Math.min(120, Math.round(raw.booking_horizon_days))
      : DEFAULT_VIP_MEETING_SETTINGS.booking_horizon_days

  return {
    slot_duration_minutes: slotDuration,
    booking_horizon_days: horizon,
    weekly: normalizeWeekly(raw.weekly),
    blocked_dates: normalizeBlockedDates(raw.blocked_dates),
  }
}

export function parseTimeToMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function isDateBlocked(dateStr: string, settings: VipMeetingSettings) {
  return settings.blocked_dates.includes(dateStr)
}

export function getDayScheduleForDate(dateStr: string, settings: VipMeetingSettings) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = String(new Date(y, m - 1, d).getDay())
  return settings.weekly[dow] ?? DEFAULT_VIP_MEETING_SETTINGS.weekly[dow]
}

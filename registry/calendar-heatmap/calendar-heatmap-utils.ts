export type CalendarHeatmapDatum = {
  /** Day in `YYYY-MM-DD` form. */
  date: string
  value: number
}

export type CalendarDay = {
  date: string
  value: number
  /** 0 is no value. 1..levels is the color step. */
  level: number
  negative: boolean
  col: number
  row: number
}

export type CalendarModel = {
  days: CalendarDay[]
  weeks: number
  months: { col: number; month: number; year: number }[]
  total: number
  activeDays: number
  peak: CalendarDay | null
  from: string
  to: string
}

const DAY_MS = 86_400_000

/** Days since 1970-01-01, in UTC, so time zones never shift a date. */
export function toDayNumber(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error(`Invalid date "${date}". Use YYYY-MM-DD.`)
  return Date.UTC(+match[1], +match[2] - 1, +match[3]) / DAY_MS
}

export function fromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

export function todayString(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function buildCalendar({
  data,
  from,
  to,
  weekStart = 0,
  levels = 4,
  max,
}: {
  data: CalendarHeatmapDatum[]
  from?: string
  to?: string
  weekStart?: 0 | 1
  levels?: number
  max?: number
}): CalendarModel {
  const values = new Map<number, number>()
  for (const d of data) {
    const day = toDayNumber(d.date)
    if (Number.isFinite(d.value)) values.set(day, (values.get(day) ?? 0) + d.value)
  }

  const end = to
    ? toDayNumber(to)
    : values.size
      ? Math.max(...values.keys())
      : toDayNumber(todayString())
  const start = from ? toDayNumber(from) : end - 364
  if (start > end) throw new Error(`"from" (${from}) is after "to" (${to}).`)

  // 1970-01-01 is a Thursday (weekday 4).
  const weekday = (day: number) => (((day + 4) % 7) + 7) % 7
  const row = (day: number) => (weekday(day) - weekStart + 7) % 7
  const gridStart = start - row(start)

  let peakAbs = 0
  for (let day = start; day <= end; day++) {
    peakAbs = Math.max(peakAbs, Math.abs(values.get(day) ?? 0))
  }
  const scale = max && max > 0 ? max : peakAbs

  const days: CalendarDay[] = []
  const months: CalendarModel["months"] = []
  let total = 0
  let activeDays = 0
  let peak: CalendarDay | null = null

  for (let day = start; day <= end; day++) {
    const value = values.get(day) ?? 0
    const col = Math.floor((day - gridStart) / 7)
    const level =
      value === 0 || scale === 0
        ? 0
        : Math.min(levels, Math.max(1, Math.ceil((Math.abs(value) / scale) * levels)))
    const cell: CalendarDay = {
      date: fromDayNumber(day),
      value,
      level,
      negative: value < 0,
      col,
      row: row(day),
    }
    days.push(cell)
    total += value
    if (value !== 0) activeDays++
    if (value !== 0 && (!peak || Math.abs(value) > Math.abs(peak.value))) peak = cell

    const date = new Date(day * DAY_MS)
    if (date.getUTCDate() === 1) {
      months.push({ col, month: date.getUTCMonth(), year: date.getUTCFullYear() })
    }
  }

  // Label a partial first month only when it has room before the next label.
  const first = new Date(start * DAY_MS)
  if (first.getUTCDate() !== 1 && (months[0]?.col ?? Infinity) >= 3) {
    months.unshift({ col: 0, month: first.getUTCMonth(), year: first.getUTCFullYear() })
  }

  return {
    days,
    weeks: Math.floor((end - gridStart) / 7) + 1,
    months,
    total,
    activeDays,
    peak,
    from: fromDayNumber(start),
    to: fromDayNumber(end),
  }
}

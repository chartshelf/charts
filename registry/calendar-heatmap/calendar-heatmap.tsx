"use client"

import * as React from "react"

import { ChartStyle, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

import {
  buildCalendar,
  type CalendarDay,
  type CalendarHeatmapDatum,
} from "./calendar-heatmap-utils"

export type { CalendarDay, CalendarHeatmapDatum }

const DEFAULT_CONFIG = {
  value: { label: "Value", color: "var(--primary)" },
  negative: { label: "Value", color: "var(--destructive)" },
} satisfies ChartConfig

const LABEL_WIDTH = 28
const MONTH_HEIGHT = 18

type CalendarHeatmapProps = Omit<React.ComponentProps<"div">, "children"> & {
  data: CalendarHeatmapDatum[]
  /** Keys: `value` for the scale color, `negative` for values under 0. */
  config?: ChartConfig
  /** First day, `YYYY-MM-DD`. Defaults to 364 days before `to`. */
  from?: string
  /** Last day, `YYYY-MM-DD`. Defaults to the last day in `data`, or today. */
  to?: string
  /** 0 starts weeks on Sunday, 1 on Monday. */
  weekStart?: 0 | 1
  levels?: number
  /** Values at or above this get the strongest color. Use it to cap outliers. */
  max?: number
  cellSize?: number
  gap?: number
  locale?: string
  loading?: boolean
  error?: React.ReactNode
  emptyMessage?: React.ReactNode
  showLegend?: boolean
  formatValue?: (value: number) => string
  onDayClick?: (day: CalendarDay) => void
}

function CalendarHeatmap({
  id,
  className,
  data,
  config: configProp,
  from,
  to,
  weekStart = 0,
  levels = 4,
  max,
  cellSize = 12,
  gap = 3,
  locale = "en-US",
  loading = false,
  error,
  emptyMessage = "No activity in this period",
  showLegend = true,
  formatValue,
  onDayClick,
  "aria-label": ariaLabel,
  ...props
}: CalendarHeatmapProps) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`
  const config = React.useMemo(() => ({ ...DEFAULT_CONFIG, ...configProp }), [configProp])

  const model = React.useMemo(
    () => buildCalendar({ data: loading ? [] : data, from, to, weekStart, levels, max }),
    [data, loading, from, to, weekStart, levels, max]
  )

  const fmt = React.useMemo(() => {
    const day = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
    const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
    const number = new Intl.NumberFormat(locale)
    return {
      day: (date: string) => day.format(new Date(`${date}T00:00:00Z`)),
      month: (m: number) => month.format(Date.UTC(2026, m, 1)),
      // 1970-01-04 is a Sunday.
      weekday: (w: number) => weekday.format(Date.UTC(1970, 0, 4 + w)),
      value: formatValue ?? ((v: number) => number.format(v)),
    }
  }, [locale, formatValue])

  const step = cellSize + gap
  const gridWidth = model.weeks * step - gap
  const width = LABEL_WIDTH + gridWidth
  const height = MONTH_HEIGHT + 7 * step - gap
  const valueLabel = typeof config.value?.label === "string" ? config.value.label : "Value"

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const cellRefs = React.useRef<(SVGRectElement | null)[]>([])
  const [focusIndex, setFocusIndex] = React.useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const [scroll, setScroll] = React.useState({ left: 0, view: gridWidth })
  const activeIndex = hoverIndex ?? focusIndex
  const active = activeIndex === null ? null : model.days[activeIndex]
  const tabIndex = Math.min(focusIndex ?? model.days.length - 1, model.days.length - 1)

  // Show the latest weeks first when the grid is wider than its box.
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth
    setScroll({ left: el.scrollLeft, view: el.clientWidth })
  }, [model.weeks])

  const fill = (day: CalendarDay) => {
    if (day.level === 0) return "var(--muted)"
    const pct = Math.round(20 + (80 * day.level) / levels)
    const color = day.negative ? "var(--color-negative)" : "var(--color-value)"
    return `color-mix(in oklab, ${color} ${pct}%, var(--muted))`
  }

  const moveFocus = (index: number) => {
    const next = Math.max(0, Math.min(model.days.length - 1, index))
    setFocusIndex(next)
    cellRefs.current[next]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (focusIndex === null) return
    const moves: Record<string, number> = {
      ArrowLeft: focusIndex - 7,
      ArrowRight: focusIndex + 7,
      ArrowUp: focusIndex - 1,
      ArrowDown: focusIndex + 1,
      Home: 0,
      End: model.days.length - 1,
    }
    if (event.key in moves) {
      event.preventDefault()
      moveFocus(moves[event.key])
    } else if ((event.key === "Enter" || event.key === " ") && onDayClick) {
      event.preventDefault()
      onDayClick(model.days[focusIndex])
    }
  }

  const overlay = error ?? (!loading && model.activeDays === 0 ? emptyMessage : null)
  // With negative values the legend runs from the strongest negative to the strongest positive.
  const hasNegative = model.days.some((d) => d.negative)
  const legendSteps = Array.from(
    { length: hasNegative ? 2 * levels + 1 : levels + 1 },
    (_, i) => (hasNegative ? i - levels : i)
  )
  const summary = loading
    ? "Loading."
    : `${valueLabel}: ${fmt.value(model.total)} in total on ${model.activeDays} of ${model.days.length} days, from ${fmt.day(model.from)} to ${fmt.day(model.to)}.` +
      (model.peak ? ` Highest: ${fmt.value(model.peak.value)} on ${fmt.day(model.peak.date)}.` : "")

  const tooltipLeft = active
    ? Math.max(64, Math.min(LABEL_WIDTH + scroll.view - 64, LABEL_WIDTH + active.col * step + cellSize / 2 - scroll.left))
    : 0
  const tooltipBelow = active ? active.row < 2 : false
  const tooltipTop = active
    ? MONTH_HEIGHT + active.row * step + (tooltipBelow ? cellSize + 6 : -6)
    : 0

  return (
    <div
      data-slot="chart"
      data-chart={chartId}
      className={cn("flex flex-col gap-2 text-xs", className)}
      aria-busy={loading || undefined}
      {...props}
      style={{ maxWidth: width, ...props.style }}
    >
      <ChartStyle id={chartId} config={config} />
      <div className={cn("relative flex", overlay && "[&_svg]:opacity-50")}>
        {/* Weekday labels stay in place when the grid scrolls. */}
        <svg width={LABEL_WIDTH} height={height} aria-hidden className="block shrink-0">
          {[1, 3, 5].map((weekday) => (
            <text
              key={weekday}
              x={0}
              y={MONTH_HEIGHT + ((weekday - weekStart + 7) % 7) * step + cellSize - 2}
              className="fill-muted-foreground"
            >
              {fmt.weekday(weekday)}
            </text>
          ))}
        </svg>
        <div
          ref={scrollRef}
          className="min-w-0 overflow-x-auto overflow-y-hidden"
          onScroll={(e) =>
            setScroll({ left: e.currentTarget.scrollLeft, view: e.currentTarget.clientWidth })
          }
        >
          <svg
            width={gridWidth}
            height={height}
            viewBox={`0 0 ${gridWidth} ${height}`}
            role="group"
            aria-label={ariaLabel ?? `${valueLabel} by day`}
            aria-describedby={`${chartId}-summary`}
            className="block"
            onKeyDown={onKeyDown}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {model.months.map((m) => (
              <text key={`${m.year}-${m.month}`} x={m.col * step} y={11} className="fill-muted-foreground">
                {fmt.month(m.month)}
              </text>
            ))}
            {model.days.map((day, i) => (
              <rect
                key={day.date}
                ref={(el) => {
                  cellRefs.current[i] = el
                }}
                x={day.col * step}
                y={MONTH_HEIGHT + day.row * step}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={fill(day)}
                tabIndex={!loading && i === tabIndex ? 0 : -1}
                role={onDayClick ? "button" : "img"}
                aria-label={`${fmt.day(day.date)}: ${fmt.value(day.value)} ${valueLabel}`}
                data-active={i === activeIndex || undefined}
                className={cn(
                  "outline-none data-active:stroke-foreground/40 focus-visible:stroke-ring focus-visible:stroke-2",
                  loading && "animate-pulse",
                  onDayClick && "cursor-pointer"
                )}
                onPointerEnter={() => !loading && setHoverIndex(i)}
                onFocus={() => setFocusIndex(i)}
                onBlur={() => setFocusIndex((f) => (f === i ? null : f))}
                onClick={onDayClick ? () => onDayClick(day) : undefined}
              />
            ))}
          </svg>
        </div>

        {overlay ? (
          <div
            role={error ? "alert" : "status"}
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
          >
            <span className="rounded-md bg-background/80 px-2 py-1">{overlay}</span>
          </div>
        ) : null}

        {active && !loading ? (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 grid min-w-32 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl"
            style={{
              left: tooltipLeft,
              top: tooltipTop,
              transform: `translate(-50%, ${tooltipBelow ? "0" : "-100%"})`,
            }}
          >
            <div className="font-medium">{fmt.day(active.date)}</div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: fill(active) }} />
              <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                <span className="text-muted-foreground">{valueLabel}</span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {fmt.value(active.value)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {showLegend && !overlay && !loading ? (
        <div aria-hidden className="flex items-center justify-end gap-1 text-muted-foreground">
          <span className="mr-1">Less</span>
          {legendSteps.map((step) => (
            <span
              key={step}
              className="rounded-[2px]"
              style={{
                width: cellSize,
                height: cellSize,
                background: fill({ level: Math.abs(step), negative: step < 0 } as CalendarDay),
              }}
            />
          ))}
          <span className="ml-1">More</span>
        </div>
      ) : null}

      <p id={`${chartId}-summary`} className="sr-only" aria-live="polite">
        {summary}
      </p>
    </div>
  )
}

export { CalendarHeatmap }

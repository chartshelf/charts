import { cacheLife } from "next/cache"

import { CalendarHeatmap, type CalendarHeatmapDatum } from "@/registry/calendar-heatmap/calendar-heatmap"
import { fromDayNumber, toDayNumber, todayString } from "@/registry/calendar-heatmap/calendar-heatmap-utils"
import { CopyCommand } from "@/components/site/copy-command"
import { PaidPreviews } from "@/components/site/paid-previews"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { WaitlistForm } from "@/components/site/waitlist-form"

const REPO = "https://github.com/chartshelf/charts"
const INSTALL = "npx shadcn@latest add chartshelf/charts/calendar-heatmap"

/** Stable fake data: the same seed gives the same page on the server and in the browser. */
function demoData(days: number, seed: number, signed = false): CalendarHeatmapDatum[] {
  let s = seed
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  const end = toDayNumber(todayString())
  return Array.from({ length: days }, (_, i) => {
    const day = end - days + 1 + i
    const weekend = ((day + 4) % 7) % 6 === 0
    const r = rand()
    const busy = weekend ? r * 3 : r < 0.18 ? 0 : 2 + r * 14
    const value = signed ? Math.round((r - 0.45) * 400) : Math.round(busy)
    return { date: fromDayNumber(day), value }
  })
}

function Logo() {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <svg viewBox="0 0 16 16" className="size-5 fill-brand" aria-hidden>
        <rect x="1" y="8" width="3.5" height="7" rx="1" />
        <rect x="6.25" y="2" width="3.5" height="13" rx="1" />
        <rect x="11.5" y="5" width="3.5" height="10" rx="1" />
      </svg>
      chartshelf
    </span>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-4">
      <p className="mb-3 text-sm font-medium">{title}</p>
      {children}
    </div>
  )
}

export default async function Home() {
  "use cache"
  cacheLife("days")
  const contributions = demoData(365, 42)
  const netChange = demoData(120, 7, true)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <header className="flex h-14 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <a href={REPO} className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <section className="py-16 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            The charts shadcn doesn&apos;t ship.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
            Heatmap, cohort grid, funnel, sankey, treemap, and waterfall. Same API, same theme, one{" "}
            <code className="font-mono text-base text-foreground">shadcn add</code>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#waitlist"
              className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Join the waitlist
            </a>
            <a
              href="#free"
              className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
            >
              Try the free chart
            </a>
          </div>
        </section>

        <section id="free" className="scroll-mt-8 pb-20">
          <h2 className="text-2xl font-semibold tracking-tight">Free: calendar heatmap</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            MIT licensed. It uses your shadcn theme and works next to the charts you already have. Hover a day, or
            focus it and use the arrow keys.
          </p>
          <div className="mt-6 grid gap-4">
            <Card title="Commits in the last year">
              <CalendarHeatmap
                data={contributions}
                config={{ value: { label: "Commits", color: "var(--brand)" } }}
                aria-label="Commits in the last year"
              />
            </Card>
            <CopyCommand command={INSTALL} />
          </div>

          <h3 className="mt-12 text-lg font-semibold tracking-tight">Every state is done for you</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card title="Negative values: net revenue change">
              <CalendarHeatmap
                data={netChange}
                from={netChange[0].date}
                config={{
                  value: { label: "Net change ($)", color: "var(--chart-2)" },
                  negative: { label: "Net change ($)", color: "var(--destructive)" },
                }}
                weekStart={1}
              />
            </Card>
            <Card title="Empty">
              <CalendarHeatmap data={[]} from="2026-07-01" to="2026-10-24" />
            </Card>
            <Card title="Loading">
              <CalendarHeatmap data={[]} from="2026-07-01" to="2026-10-24" loading />
            </Card>
            <Card title="Error">
              <CalendarHeatmap data={[]} from="2026-07-01" to="2026-10-24" error="Could not load data. Try again." />
            </Card>
          </div>
        </section>

        <section className="pb-20">
          <h2 className="text-2xl font-semibold tracking-tight">In the pack</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Six charts for the questions dashboards ask. Each one has light and dark mode, empty and loading
            states, keyboard focus, and screen reader text.
          </p>
          <div className="mt-6">
            <PaidPreviews />
          </div>
        </section>

        <section id="waitlist" className="grid scroll-mt-8 gap-10 pb-24 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Get it first</h2>
            <p className="mt-2 text-muted-foreground">
              The pack costs <span className="font-medium text-foreground">$79</span> one-time for one developer,
              or <span className="font-medium text-foreground">$199</span> for a team of up to 10. Waitlist members
              get it for <span className="font-medium text-foreground">$59</span>.
            </p>
            <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
              <li>Lifetime updates, new charts included</li>
              <li>Unlimited projects and client work</li>
              <li>Install with the shadcn CLI from a private GitHub repo</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <WaitlistForm />
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 border-t py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <Logo />
        <p>
          Free charts are{" "}
          <a href={REPO} className="underline underline-offset-4 hover:text-foreground">
            MIT on GitHub
          </a>
          . Not affiliated with shadcn/ui.
        </p>
      </footer>
    </div>
  )
}

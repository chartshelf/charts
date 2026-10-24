// Still pictures of the paid charts for the waitlist page. They are drawings, not charts.

const shade = (o: number) => ({ className: "fill-primary", fillOpacity: o })

function Heatmap() {
  const cells = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 12; c++) {
      const o = 0.12 + 0.88 * Math.abs(Math.sin(r * 1.7 + c * 0.9) * Math.cos(c * 0.35))
      cells.push(<rect key={`${r}-${c}`} x={8 + c * 12.5} y={8 + r * 15} width={10.5} height={13} rx={2} {...shade(o)} />)
    }
  }
  return <>{cells}</>
}

function Cohort() {
  const cells = []
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8 - r; c++) {
      const o = c === 0 ? 1 : Math.max(0.12, 0.75 - c * 0.1 - r * 0.04)
      cells.push(<rect key={`${r}-${c}`} x={8 + c * 18} y={6 + r * 13} width={16} height={11} rx={2} {...shade(o)} />)
    }
  }
  return <>{cells}</>
}

function Funnel() {
  return (
    <>
      {[136, 104, 72, 46, 26].map((w, i) => (
        <rect key={w} x={80 - w / 2} y={7 + i * 16} width={w} height={13} rx={2} {...shade(1 - i * 0.17)} />
      ))}
    </>
  )
}

function Sankey() {
  const band = "fill-primary"
  return (
    <>
      <path d="M18 10 C80 10 80 12 142 12 L142 34 C80 34 80 40 18 40 Z" className={band} fillOpacity={0.3} />
      <path d="M18 40 C80 40 80 58 142 58 L142 70 C80 70 80 58 18 58 Z" className={band} fillOpacity={0.2} />
      <path d="M18 58 C80 58 80 36 142 36 L142 54 C80 54 80 80 18 80 Z" className={band} fillOpacity={0.14} />
      <rect x={10} y={10} width={8} height={70} rx={2} {...shade(1)} />
      <rect x={142} y={12} width={8} height={22} rx={2} {...shade(0.9)} />
      <rect x={142} y={36} width={8} height={18} rx={2} {...shade(0.7)} />
      <rect x={142} y={58} width={8} height={12} rx={2} {...shade(0.5)} />
    </>
  )
}

function Treemap() {
  const boxes: [number, number, number, number, number][] = [
    [8, 8, 76, 74, 1],
    [86, 8, 66, 40, 0.7],
    [86, 50, 34, 32, 0.45],
    [122, 50, 30, 18, 0.3],
    [122, 70, 30, 12, 0.18],
  ]
  return (
    <>
      {boxes.map(([x, y, w, h, o]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={3} {...shade(o)} />
      ))}
    </>
  )
}

function Waterfall() {
  const steps = [
    { y: 30, h: 52, o: 1 },
    { y: 14, h: 16, o: 0.55 },
    { y: 14, h: 10, o: 0.25 },
    { y: 24, h: 8, o: 0.25 },
    { y: 6, h: 26, o: 0.55 },
    { y: 6, h: 76, o: 1 },
  ]
  return (
    <>
      <line x1={6} x2={154} y1={82.5} y2={82.5} className="stroke-border" />
      {steps.map((s, i) => (
        <rect key={i} x={10 + i * 24} y={s.y} width={18} height={s.h} rx={2} {...shade(s.o)} />
      ))}
    </>
  )
}

export const PAID_CHARTS = [
  { id: "heatmap", name: "Heatmap", question: "When is activity high?", Art: Heatmap },
  { id: "cohort-grid", name: "Cohort retention grid", question: "Do signup groups stay?", Art: Cohort },
  { id: "funnel", name: "Funnel", question: "Where do users drop off?", Art: Funnel },
  { id: "sankey", name: "Sankey", question: "Where does traffic or money flow?", Art: Sankey },
  { id: "treemap", name: "Treemap", question: "What takes the most share?", Art: Treemap },
  { id: "waterfall", name: "Waterfall", question: "What moved revenue up or down?", Art: Waterfall },
] as const

export function PaidPreviews() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PAID_CHARTS.map(({ id, name, question, Art }) => (
        <li key={id} className="rounded-xl border bg-card p-4">
          <svg viewBox="0 0 160 90" role="img" aria-label={`Preview of the ${name} chart`} className="mb-3 w-full">
            <Art />
          </svg>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{question}</p>
        </li>
      ))}
    </ul>
  )
}

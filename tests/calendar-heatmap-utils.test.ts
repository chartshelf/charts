import assert from "node:assert/strict"
import { test } from "node:test"

import { buildCalendar, toDayNumber } from "../registry/calendar-heatmap/calendar-heatmap-utils.ts"

test("a default range is 365 days that ends on the last data day", () => {
  const m = buildCalendar({ data: [{ date: "2026-10-24", value: 3 }] })
  assert.equal(m.days.length, 365)
  assert.equal(m.to, "2026-10-24")
  assert.equal(m.from, "2025-10-25")
})

test("rows follow the week start and columns are whole weeks", () => {
  // 2026-10-24 is a Saturday.
  const sun = buildCalendar({ data: [], from: "2026-10-24", to: "2026-10-25" })
  assert.deepEqual(sun.days.map((d) => [d.row, d.col]), [[6, 0], [0, 1]])
  const mon = buildCalendar({ data: [], from: "2026-10-24", to: "2026-10-25", weekStart: 1 })
  assert.deepEqual(mon.days.map((d) => [d.row, d.col]), [[5, 0], [6, 0]])
  assert.equal(mon.weeks, 1)
})

test("levels scale to the peak absolute value, and negatives keep their sign", () => {
  const m = buildCalendar({
    data: [
      { date: "2026-01-01", value: 10 },
      { date: "2026-01-02", value: 1 },
      { date: "2026-01-03", value: -5 },
      { date: "2026-01-04", value: 0 },
    ],
    from: "2026-01-01",
    to: "2026-01-04",
  })
  assert.deepEqual(m.days.map((d) => [d.level, d.negative]), [[4, false], [1, false], [2, true], [0, false]])
  assert.equal(m.total, 6)
  assert.equal(m.activeDays, 3)
  assert.equal(m.peak?.date, "2026-01-01")
})

test("max caps outliers, and duplicate dates add up", () => {
  const m = buildCalendar({
    data: [
      { date: "2026-01-01", value: 1000 },
      { date: "2026-01-02", value: 2 },
      { date: "2026-01-02", value: 3 },
    ],
    from: "2026-01-01",
    to: "2026-01-02",
    max: 10,
  })
  assert.deepEqual(m.days.map((d) => [d.value, d.level]), [[1000, 4], [5, 2]])
})

test("empty data gives level 0 everywhere and no peak", () => {
  const m = buildCalendar({ data: [], from: "2026-01-01", to: "2026-01-31" })
  assert.ok(m.days.every((d) => d.level === 0))
  assert.equal(m.peak, null)
  assert.equal(m.activeDays, 0)
})

test("month labels skip a partial first month that is too narrow", () => {
  const wide = buildCalendar({ data: [], from: "2026-01-05", to: "2026-03-31" })
  assert.deepEqual(wide.months.map((x) => x.month), [0, 1, 2])
  const narrow = buildCalendar({ data: [], from: "2026-01-28", to: "2026-03-31" })
  assert.deepEqual(narrow.months.map((x) => x.month), [1, 2])
})

test("dates are UTC days, and bad input throws", () => {
  assert.equal(toDayNumber("1970-01-02"), 1)
  assert.throws(() => toDayNumber("2026-1-2"), /YYYY-MM-DD/)
  assert.throws(() => buildCalendar({ data: [], from: "2026-02-01", to: "2026-01-01" }), /after/)
})

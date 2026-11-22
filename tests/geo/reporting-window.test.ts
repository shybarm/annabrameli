import { strict as assert } from "node:assert";
import { reportingBatches, settledSearchDay, shiftDay } from "../../src/lib/geo/reporting-window.ts";

Deno.test("reporting cut-off uses Google's calendar day across daylight saving", () => {
  assert.equal(settledSearchDay(new Date("2026-11-01T06:59:59Z")), "2026-10-28");
  assert.equal(settledSearchDay(new Date("2026-11-01T07:00:00Z")), "2026-10-29");
  assert.equal(settledSearchDay(new Date("2026-11-22T20:00:00Z")), "2026-11-19");
});

Deno.test("backfill covers current and previous periods exactly once, newest first", () => {
  for (const length of [7, 28, 90]) {
    const dates: string[] = [];
    for (const batch of reportingBatches("2026-01-03", length * 2)) {
      for (let date = batch.endDate; date >= batch.startDate; date = shiftDay(date, -1)) dates.push(date);
    }
    assert.deepEqual(dates, Array.from({ length: length * 2 }, (_, i) => shiftDay("2026-01-03", -i)));
  }
});

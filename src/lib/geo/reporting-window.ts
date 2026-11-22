// Search Console reports calendar days in Pacific time, including across DST.
export function shiftDay(day: string, offset: number): string {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function settledSearchDay(now = new Date()): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return shiftDay(day, -3);
}

// Include the comparison period. Request the newest week first so an
// interrupted sync can already improve the most recent report.
export function reportingBatches(end: string, days: number) {
  const batches = [];
  for (let offset = 0; offset < days; offset += 7) {
    batches.push({
      startDate: shiftDay(end, -Math.min(offset + 6, days - 1)),
      endDate: shiftDay(end, -offset),
    });
  }
  return batches;
}

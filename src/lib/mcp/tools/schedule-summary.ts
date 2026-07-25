import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_schedule_summary",
  title: "Get schedule summary",
  description:
    "Aggregate appointment counts per day and per status for a date range. Contains no patient data.",
  inputSchema: {
    from: z.string().describe("Start of the range, ISO date or datetime. Defaults to today."),
    days: z.number().describe("Number of days to summarize, capped at 60. Defaults to 7."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, days }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated;

    const start = from ? new Date(from) : new Date();
    if (Number.isNaN(start.getTime())) return errorResult("Invalid `from` value.");
    const span = Math.min(Math.max(Number(days) || 7, 1), 60);
    const end = new Date(start.getTime() + span * 24 * 60 * 60 * 1000);

    const { data, error } = await supabaseForUser(ctx)
      .from("appointments")
      .select("scheduled_at, status")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at")
      .limit(2000);
    if (error) return errorResult(error.message);

    const byDay: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const row of data ?? []) {
      const day = String(row.scheduled_at).slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
      const status = row.status ?? "unknown";
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }

    return jsonResult({
      from: start.toISOString(),
      to: end.toISOString(),
      total: data?.length ?? 0,
      by_day: byDay,
      by_status: byStatus,
    });
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_appointments",
  title: "List appointments",
  description:
    "List clinic appointments in a date range. Returns scheduling data only (time, duration, status, clinic) and never patient identifiers or medical details.",
  inputSchema: {
    from: z.string().describe("Start of the range, ISO date or datetime. Defaults to now."),
    to: z.string().describe("End of the range, ISO date or datetime. Defaults to 14 days after `from`."),
    clinic_id: z.string().describe("Optional clinic id to filter by. Pass an empty string for all clinics."),
    limit: z.number().describe("Maximum rows to return. Capped at 200."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, clinic_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated;

    const start = from ? new Date(from) : new Date();
    if (Number.isNaN(start.getTime())) return errorResult("Invalid `from` value.");
    const end = to ? new Date(to) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(end.getTime())) return errorResult("Invalid `to` value.");

    const rowLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    let query = supabaseForUser(ctx)
      .from("appointments")
      .select("id, clinic_id, scheduled_at, duration_minutes, status")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at")
      .limit(rowLimit);

    if (clinic_id) query = query.eq("clinic_id", clinic_id);

    const { data, error } = await query;
    if (error) return errorResult(error.message);

    return jsonResult({
      from: start.toISOString(),
      to: end.toISOString(),
      count: data?.length ?? 0,
      appointments: data ?? [],
      note: "Patient identifiers and medical details are intentionally excluded from MCP responses.",
    });
  },
});

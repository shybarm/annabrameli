import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, jsonResult, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "whoami",
  title: "Who am I",
  description:
    "Return the signed-in user's identity and clinic roles. Use it to verify the connection works and what access is available.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated;
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, clinic_id")
      .eq("user_id", ctx.getUserId());
    if (error) return errorResult(error.message);
    return jsonResult({
      user_id: ctx.getUserId(),
      email: ctx.getUserEmail(),
      roles: data ?? [],
    });
  },
});

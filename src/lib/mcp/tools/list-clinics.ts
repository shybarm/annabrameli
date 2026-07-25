import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, jsonResult, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_clinics",
  title: "List clinics",
  description:
    "List the active clinics the signed-in user can access, including name, city, phone and doctor details.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated;
    const { data, error } = await supabaseForUser(ctx)
      .from("clinics")
      .select("id, name, city, address, phone, email, doctor_name, doctor_specialty, is_active")
      .eq("is_active", true)
      .order("name");
    if (error) return errorResult(error.message);
    return jsonResult({ clinics: data ?? [] });
  },
});

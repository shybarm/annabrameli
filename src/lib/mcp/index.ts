import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listClinicsTool from "./tools/list-clinics";
import listAppointmentsTool from "./tools/list-appointments";
import scheduleSummaryTool from "./tools/schedule-summary";

// The OAuth issuer must be the direct Supabase host, built from the project ref
// (inlined by Vite at build time so this module stays import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ihaveallergy-mcp",
  title: "Dr. Anna Brameli Clinic MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Dr. Anna Brameli allergy clinic system. Use `whoami` to confirm access, `list_clinics` for clinic details, `list_appointments` for scheduling data in a date range, and `get_schedule_summary` for daily load. Responses never include patient names or medical records - protected health information stays inside the clinic system.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listClinicsTool, listAppointmentsTool, scheduleSummaryTool],
});

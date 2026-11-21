export const adminNavPages = {
  "/admin/whatsapp": () => import("@/pages/admin/WhatsAppInbox"),
  "/admin": () => import("@/pages/admin/Dashboard"),
  "/admin/patients": () => import("@/pages/admin/PatientsList"),
  "/admin/appointments": () => import("@/pages/admin/AppointmentsList"),
  "/admin/doctor-diary": () => import("@/pages/admin/DoctorDiaryPage"),
  "/admin/cancellations": () => import("@/pages/admin/CancellationsReport"),
  "/admin/billing": () => import("@/pages/admin/BillingPage"),
  "/admin/expenses": () => import("@/pages/admin/ExpensesPage"),
  "/admin/team": () => import("@/pages/admin/TeamPage"),
  "/admin/work-hours": () => import("@/pages/admin/WorkHoursPage"),
  "/admin/settings": () => import("@/pages/admin/SettingsPage"),
  "/admin/geo": () => import("@/pages/admin/GeoOptimizationPage"),
};

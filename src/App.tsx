import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, setQueryClientRef } from "@/hooks/useAuth";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Updates from "./pages/Updates";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import PatientIntake from "./pages/PatientIntake";
import AdminDashboard from "./pages/admin/Dashboard";
import PatientsList from "./pages/admin/PatientsList";
import PatientDetail from "./pages/admin/PatientDetail";
import NewPatient from "./pages/admin/NewPatient";
import AppointmentsList from "./pages/admin/AppointmentsList";
import AppointmentDetail from "./pages/admin/AppointmentDetail";
import NewAppointment from "./pages/admin/NewAppointment";
import BillingPage from "./pages/admin/BillingPage";
import NewInvoice from "./pages/admin/NewInvoice";
import InvoiceDetail from "./pages/admin/InvoiceDetail";
import ExpensesPage from "./pages/admin/ExpensesPage";
import MessagesPage from "./pages/admin/MessagesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import TeamPage from "./pages/admin/TeamPage";
import ReferralDashboard from "./pages/admin/ReferralDashboard";
import StaffIntake from "./pages/admin/StaffIntake";
import AuditLogPage from "./pages/admin/AuditLogPage";
import DoctorDiaryPage from "./pages/admin/DoctorDiaryPage";
import WorkHoursPage from "./pages/admin/WorkHoursPage";
import CancellationsReport from "./pages/admin/CancellationsReport";
import PatientPortal from "./pages/patient/PatientPortal";
import GuestBooking from "./pages/GuestBooking";
import JoinTeam from "./pages/JoinTeam";
import PatientInviteAccept from "./pages/PatientInviteAccept";
import VerifyBooking from "./pages/VerifyBooking";
import VerifyEmail from "./pages/VerifyEmail";
import MagicLink from "./pages/MagicLink";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AccessibilityStatement from "./pages/AccessibilityStatement";
import SecurityPolicy from "./pages/SecurityPolicy";
import DrAnnaBrameli from "./pages/DrAnnaBrameli";
import WhoIs from "./pages/WhoIs";
import Blog from "./pages/Blog";
import BlogArticlePage from "./pages/BlogArticle";
import GoldenGuide from "./pages/GoldenGuide";
import GoldenGuideRights from "./pages/GoldenGuideRights";
import GoldenGuideTesting from "./pages/GoldenGuideTesting";
import RashAfterBamba from "./pages/knowledge/RashAfterBamba";
import RednessAroundMouth from "./pages/knowledge/RednessAroundMouth";
import BambaAt4Months from "./pages/knowledge/BambaAt4Months";
import VomitingAfterTahini from "./pages/knowledge/VomitingAfterTahini";
import DaysBetweenAllergens from "./pages/knowledge/DaysBetweenAllergens";

// Layout for public pages
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
    <ChatWidget />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Set the query client reference for auth signOut to clear cache
setQueryClientRef(queryClient);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ClinicProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AccessibilityMenu />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicLayout><Index /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
              <Route path="/updates" element={<PublicLayout><Updates /></PublicLayout>} />
              <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
              <Route path="/accessibility" element={<PublicLayout><AccessibilityStatement /></PublicLayout>} />
              <Route path="/security" element={<PublicLayout><SecurityPolicy /></PublicLayout>} />
              <Route path="/dr-anna-brameli" element={<DrAnnaBrameli />} />
              <Route path="/whois" element={<WhoIs />} />
              <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
              <Route path="/blog/:slug" element={<PublicLayout><BlogArticlePage /></PublicLayout>} />
              <Route path="/guides/טעימות-ראשונות-אלרגנים" element={<PublicLayout><GoldenGuide /></PublicLayout>} />
              <Route path="/guides/זכויות-ילד-אלרגי-ישראל" element={<PublicLayout><GoldenGuideRights /></PublicLayout>} />
              <Route path="/guides/בדיקות-אלרגיה-ילדים-ישראל" element={<PublicLayout><GoldenGuideTesting /></PublicLayout>} />
              {/* Knowledge satellite articles */}
              <Route path="/knowledge/פריחה-אחרי-במבה" element={<PublicLayout><RashAfterBamba /></PublicLayout>} />
              <Route path="/knowledge/אודם-סביב-הפה-אחרי-אלרגן" element={<PublicLayout><RednessAroundMouth /></PublicLayout>} />
              <Route path="/knowledge/במבה-גיל-4-חודשים" element={<PublicLayout><BambaAt4Months /></PublicLayout>} />
              <Route path="/knowledge/הקאה-אחרי-טחינה" element={<PublicLayout><VomitingAfterTahini /></PublicLayout>} />
              <Route path="/knowledge/כמה-ימים-בין-אלרגנים" element={<PublicLayout><DaysBetweenAllergens /></PublicLayout>} />
              {/* Auth */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Patient Intake (public) */}
              <Route path="/intake/:token" element={<PatientIntake />} />
              
              {/* Guest Booking (public) */}
              <Route path="/book" element={<GuestBooking />} />
              
              {/* Booking Verification (public) */}
              <Route path="/verify-booking" element={<VerifyBooking />} />
              
              {/* Email Verification (public) */}
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/magic" element={<MagicLink />} />
              
              {/* Team Join (public) */}
              <Route path="/join/:code" element={<JoinTeam />} />
              
              {/* Patient Invite (public) */}
              <Route path="/patient-invite/:code" element={<PatientInviteAccept />} />
              
              {/* Patient Portal - DISABLED per ISO 27799 */}
              {/* <Route path="/portal" element={<PatientPortal />} /> */}
              
              {/* Admin routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/patients" element={<PatientsList />} />
              <Route path="/admin/patients/new" element={<NewPatient />} />
              <Route path="/admin/patients/:id" element={<PatientDetail />} />
              <Route path="/admin/appointments" element={<AppointmentsList />} />
              <Route path="/admin/appointments/new" element={<NewAppointment />} />
              <Route path="/admin/appointments/:id" element={<AppointmentDetail />} />
              <Route path="/admin/billing" element={<BillingPage />} />
              <Route path="/admin/billing/new" element={<NewInvoice />} />
              <Route path="/admin/billing/:id" element={<InvoiceDetail />} />
              <Route path="/admin/expenses" element={<ExpensesPage />} />
              <Route path="/admin/messages" element={<MessagesPage />} />
              <Route path="/admin/team" element={<TeamPage />} />
              <Route path="/admin/referrals" element={<ReferralDashboard />} />
              <Route path="/admin/intake" element={<StaffIntake />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/audit-log" element={<AuditLogPage />} />
              <Route path="/admin/doctor-diary" element={<DoctorDiaryPage />} />
              <Route path="/admin/work-hours" element={<WorkHoursPage />} />
              <Route path="/admin/cancellations" element={<CancellationsReport />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClinicProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

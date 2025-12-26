import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";
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
import PatientPortal from "./pages/patient/PatientPortal";
import GuestBooking from "./pages/GuestBooking";
import JoinTeam from "./pages/JoinTeam";
import NotFound from "./pages/NotFound";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLayout><Index /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
            <Route path="/updates" element={<PublicLayout><Updates /></PublicLayout>} />
            <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            
            {/* Auth */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Patient Intake (public) */}
            <Route path="/intake/:token" element={<PatientIntake />} />
            
            {/* Guest Booking (public) */}
            <Route path="/book" element={<GuestBooking />} />
            
            {/* Team Join (public) */}
            <Route path="/join/:code" element={<JoinTeam />} />
            
            {/* Patient Portal */}
            <Route path="/portal" element={<PatientPortal />} />
            
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
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

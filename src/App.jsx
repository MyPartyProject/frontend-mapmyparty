import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetailNew";
import PaymentCheckout from "./pages/PaymentCheckout";
import BookingSuccess from "./pages/BookingSuccess";
import Auth from "./pages/Auth";
import GoogleCallback from "./pages/GoogleCallback";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/NewUserDashboard";
import Dashboard from "./components/dashboard/Dashboard";
import BrowseEvents from "./components/dashboard/BrowseEvents";
import MyBookings from "./pages/MyBookings";
import AttendeeProfile from "./pages/AttendeeProfile";
import PromoterDashboard from "./pages/PromoterDashboard";
import PromoterEventDetail from "./pages/PromoterEventDetail";
import PromoterOverview from "./components/promoter/PromoterOverview";
import PromoterOrganizers from "./components/promoter/PromoterOrganizers";
import PromoterOrganizerDetail from "./components/promoter/PromoterOrganizerDetail";
import PromoterEvents from "./components/promoter/PromoterEvents";
import PromoterAnalytics from "./components/promoter/PromoterAnalytics";
import PromoterLiveEvents from "./components/promoter/PromoterLiveEvents";
import PromoterLiveEventDetail from "./components/promoter/PromoterLiveEventDetail";
import PromoterUsers from "./components/promoter/PromoterUsers";
import PromoterUserDetail from "./components/promoter/PromoterUserDetail";
import PromoterBookings from "./components/promoter/PromoterBookings";
import PromoterPayouts from "./components/promoter/PromoterPayouts";
import PromoterReports from "./components/promoter/PromoterReports";
import PromoterBilling from "./components/promoter/PromoterBilling";
import PromoterBillingDetail from "./components/promoter/PromoterBillingDetail";
import CreateEvent from "./pages/CreateEvent.jsx";
import EventTypeSelection from "./pages/EventTypeSelection";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import PromoterProfile from "./pages/PromoterProfile";
import PromoterLogin from "./pages/PromoterLogin";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import EventAnalyticsPage from "./pages/EventAnalyticsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import EventOverviewPage from "./pages/EventOverviewPage";
import ReceptionDetail from "./pages/ReceptionDetail";
import About from "./pages/About";
import HostEvents from "./pages/HostEvents";
import Contact from "./pages/Contact";
import Policies from "./pages/Policies";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import CookiePolicy from "./pages/CookiePolicy";
import Footer from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import OrganizerOnboarding from "./pages/OrganizerOnboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const PublicShell = () => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    <div className="flex-1">
      <Outlet />
    </div>
    <Footer />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-theme promoter-theme min-h-screen bg-background text-foreground">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <Routes>
              <Route element={<PublicShell />}>
                <Route path="/" element={<Index />} />
                <Route path="/my-bookings" element={<Navigate to="/dashboard/bookings" replace />} />
                {/* <Route path="/events" element={<Events />} /> */}
                <Route path="/browse-events" element={<BrowseEvents showPublicHeader />} />
                <Route path="/events/:organizerSlug/:eventSlug" element={<EventDetail />} />
                <Route path="/events/:organizerSlug/:eventSlug/checkout" element={<PaymentCheckout />} />
                <Route path="/events/:organizerSlug/:eventSlug/overview" element={<EventOverviewPage />} />
                <Route path="/booking-success" element={
                  <ProtectedRoute>
                    <BookingSuccess />
                  </ProtectedRoute>
                } />
                <Route path="/about" element={<About />} />
                <Route path="/host-events" element={<HostEvents />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/google/callback" element={<GoogleCallback />} />
                <Route path="/promoter/login" element={<PromoterLogin />} />
              </Route>
              
              {/* Protected User Dashboard Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRole="user">
                  <UserDashboard />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="browse-events" element={<BrowseEvents />} />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="profile" element={<AttendeeProfile />} />
                <Route path="*" element={<Dashboard />} />
              </Route>
              
              {/* Protected Organizer Routes */}
              <Route path="/organizer/dashboard" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />

               <Route path="/organizer/profile" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />

              <Route path="/organizer/myevents" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/analytics" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/live" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/reception" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/food-beverages" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/payouts" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/payouts/:id" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/events/:eventId/attendees" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/events/:eventId/refunds" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/:organizerSlug/events/:eventSlug/analytics" element={
                <ProtectedRoute requiredRole="organizer">
                  <EventAnalyticsPage />
                </ProtectedRoute>
              } />
              {/* <Route path="/organizer/financial" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } /> */}
              <Route path="/organizer/reception/:id" element={
                <ProtectedRoute requiredRole="organizer">
                  <ReceptionDetail />
                </ProtectedRoute>
              } />
              <Route path="/organizer/live/:id" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/dashboard-v2" element={<Navigate to="/organizer/dashboard" replace />} />
              <Route path="/organizer/onboarding" element={
                <ProtectedRoute requiredRole="organizer" skipOrganizerOnboarding>
                  <OrganizerOnboarding />
                </ProtectedRoute>
              } />
              <Route path="/organizer/select-event-type" element={
                <ProtectedRoute requiredRole="organizer">
                  <EventTypeSelection />
                </ProtectedRoute>
              } />
              <Route path="/organizer/create-event" element={
                <ProtectedRoute requiredRole="organizer">
                  <CreateEvent />
                </ProtectedRoute>
              } />
              
              {/* Protected Promoter Routes */}
              <Route path="/promoter" element={
                <ProtectedRoute requiredRole="promoter">
                  <PromoterDashboard />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/promoter/overview" replace />} />
                <Route path="overview" element={<PromoterOverview />} />
                <Route path="organizers" element={<PromoterOrganizers />} />
                <Route path="organizers/:id" element={<PromoterOrganizerDetail />} />
                <Route path="events" element={<PromoterEvents />} />
                <Route path="events/:id" element={<PromoterEventDetail />} />
                <Route path="users" element={<PromoterUsers />} />
                <Route path="users/:id" element={<PromoterUserDetail />} />
                <Route path="bookings" element={<PromoterBookings />} />
                <Route path="payouts" element={<PromoterPayouts />} />
                <Route path="live" element={<PromoterLiveEvents />} />
                <Route path="live/:id" element={<PromoterLiveEventDetail />} />
                <Route path="analytics" element={<PromoterAnalytics />} />
                <Route path="reports" element={<PromoterReports />} />
                <Route path="billing" element={<PromoterBilling />} />
                <Route path="billing/:slug" element={<PromoterBillingDetail />} />
              </Route>
              <Route path="/promoter/dashboard" element={
                <ProtectedRoute requiredRole="promoter">
                  <Navigate to="/promoter/overview" replace />
                </ProtectedRoute>
              } />
              <Route path="/promoter/event/:id" element={
                <ProtectedRoute requiredRole="promoter">
                  <PromoterEventDetail />
                </ProtectedRoute>
              } />
              <Route path="/promoter/profile" element={
                <ProtectedRoute requiredRole="promoter">
                  <PromoterProfile />
                </ProtectedRoute>
              } />
              
              {/* Protected Profile Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </div>
    </QueryClientProvider>
  );
};

export default App;

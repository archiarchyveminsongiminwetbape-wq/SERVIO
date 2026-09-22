import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { I18nProvider } from '@/context/I18nContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CategorySeeder from '@/components/CategorySeeder';
import AIChatbot from '@/components/AIChatbot';
import AdminDashboard from '@/components/AdminDashboard';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ProviderProfilePage = lazy(() => import('@/pages/ProviderProfilePage'));
const PortfolioItemDetailPage = lazy(() => import('@/pages/PortfolioItemDetailPage'));
const BookingPage = lazy(() => import('@/pages/BookingPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const ProviderDashboardPage = lazy(() => import('@/pages/ProviderDashboardPage'));
const AdminEscrowDashboard = lazy(() => import('@/pages/AdminEscrowDashboard'));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'));
const ProviderProfileEditPage = lazy(() => import('@/pages/ProviderProfileEditPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const UserBookingsPage = lazy(() => import('@/pages/UserBookingsPage'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const SubscriptionCheckoutPage = lazy(() => import('@/pages/SubscriptionCheckoutPage'));
const RecommendationsPage = lazy(() => import('@/pages/RecommendationsPage'));
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage'));
const ProviderProjectsPage = lazy(() => import('@/pages/ProviderProjectsPage'));
const QuotesPage = lazy(() => import('@/pages/QuotesPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'));
const SubscriptionSuccessPage = lazy(() => import('@/pages/SubscriptionSuccessPage'));

// Prefetch critical routes
const prefetchRoutes = () => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // Prefetch most likely next pages
      import('@/pages/SearchPage');
      import('@/pages/LoginPage');
      import('@/pages/SignupPage');
      import('@/pages/ProviderProfilePage');
      import('@/pages/BookingPage');
    });
  }
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-900">
      <div className="mx-auto w-full max-w-[1800px]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <AIChatbot />
    </div>
  );
}

function App() {
  prefetchRoutes();
  return (
    <I18nProvider>
      <DarkModeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-4 text-neutral-600 dark:text-neutral-400">Chargement...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/login" element={<><Navbar /><LoginPage /></>} />
                <Route path="/signup" element={<><Navbar /><SignupPage /></>} />
                <Route path="/reset-password" element={<><Navbar /><ResetPasswordPage /></>} />
                <Route path="/admin/seed-categories" element={<CategorySeeder />} />
                <Route path="/" element={<Layout><LandingPage /></Layout>} />
                <Route path="/search" element={<Layout><SearchPage /></Layout>} />
                <Route path="/provider/:slug" element={<Layout><ProviderProfilePage /></Layout>} />
                <Route path="/portfolio/:itemId" element={<Layout><PortfolioItemDetailPage /></Layout>} />
                <Route path="/provider/:slug/book" element={<Layout><BookingPage /></Layout>} />
                <Route path="/messages" element={<Layout><MessagesPage /></Layout>} />
                <Route path="/favorites" element={<Layout><FavoritesPage /></Layout>} />
                <Route path="/profile" element={<Layout><UserProfilePage /></Layout>} />
                <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
                <Route path="/faq" element={<Layout><FaqPage /></Layout>} />
                <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
                <Route path="/bookings" element={<Layout><UserBookingsPage /></Layout>} />
                <Route path="/subscription" element={<Layout><SubscriptionPage /></Layout>} />
                <Route path="/subscription/checkout" element={<Layout><SubscriptionCheckoutPage /></Layout>} />
                <Route path="/recommendations" element={<Layout><RecommendationsPage /></Layout>} />
                <Route path="/invoices" element={<Layout><InvoicesPage /></Layout>} />
                <Route path="/quotes" element={<Layout><QuotesPage /></Layout>} />
                <Route path="/provider/:slug/projects" element={<Layout><ProviderProjectsPage /></Layout>} />
                <Route path="/provider/dashboard" element={<Layout><ProviderDashboardPage /></Layout>} />
                <Route path="/provider/edit" element={<Layout><ProviderProfileEditPage /></Layout>} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/escrow" element={<Layout><AdminEscrowDashboard /></Layout>} />
                <Route path="/payment/success" element={<Layout><PaymentSuccessPage /></Layout>} />
                <Route path="/subscription/success" element={<Layout><SubscriptionSuccessPage /></Layout>} />
                <Route path="*" element={<Layout><LandingPage /></Layout>} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </DarkModeProvider>
    </I18nProvider>
  );
}

export default App;

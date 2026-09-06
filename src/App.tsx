import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { I18nProvider } from '@/context/I18nContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CategorySeeder from '@/components/CategorySeeder';
import AIChatbot from '@/components/AIChatbot';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ProviderProfilePage = lazy(() => import('@/pages/ProviderProfilePage'));
const PortfolioItemDetailPage = lazy(() => import('@/pages/PortfolioItemDetailPage'));
const BookingPage = lazy(() => import('@/pages/BookingPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const ProviderDashboardPage = lazy(() => import('@/pages/ProviderDashboardPage'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
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
                <Route
                  path="*"
                  element={
                    <Layout>
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/provider/:slug" element={<ProviderProfilePage />} />
                        <Route path="/portfolio/:itemId" element={<PortfolioItemDetailPage />} />
                        <Route path="/provider/:slug/book" element={<BookingPage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/favorites" element={<FavoritesPage />} />
                        <Route path="/profile" element={<UserProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/faq" element={<FaqPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/bookings" element={<UserBookingsPage />} />
                        <Route path="/subscription" element={<SubscriptionPage />} />
                        <Route path="/subscription/checkout" element={<SubscriptionCheckoutPage />} />
                        <Route path="/recommendations" element={<RecommendationsPage />} />
                        <Route path="/invoices" element={<InvoicesPage />} />
                        <Route path="/quotes" element={<QuotesPage />} />
                        <Route path="/provider/:slug/projects" element={<ProviderProjectsPage />} />
                        <Route path="/provider/dashboard" element={<ProviderDashboardPage />} />
                        <Route path="/provider/edit" element={<ProviderProfileEditPage />} />
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="*" element={<LandingPage />} />
                      </Routes>
                    </Layout>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </DarkModeProvider>
    </I18nProvider>
  );
}

export default App;

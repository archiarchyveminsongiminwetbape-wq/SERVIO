import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { I18nProvider } from '@/context/I18nContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LandingPage from '@/pages/LandingPage';
import SearchPage from '@/pages/SearchPage';
import ProviderProfilePage from '@/pages/ProviderProfilePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import SignupConfirmationPage from '@/pages/SignupConfirmationPage';
import MessagesPage from '@/pages/MessagesPage';
import FavoritesPage from '@/pages/FavoritesPage';
import ProviderDashboardPage from '@/pages/ProviderDashboardPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import UserProfilePage from '@/pages/UserProfilePage';
import ProviderProfileEditPage from '@/pages/ProviderProfileEditPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SettingsPage from '@/pages/SettingsPage';
import FaqPage from '@/pages/FaqPage';
import NotificationsPage from '@/pages/NotificationsPage';
import CategorySeeder from '@/components/CategorySeeder';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <DarkModeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/signup/confirmation" element={<SignupConfirmationPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/admin/seed-categories" element={<CategorySeeder />} />
              <Route
                path="*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/provider/:slug" element={<ProviderProfilePage />} />
                      <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/profile" element={<UserProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/faq" element={<FaqPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/provider/dashboard" element={<ProviderDashboardPage />} />
                      <Route path="/provider/edit" element={<ProviderProfileEditPage />} />
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="*" element={<LandingPage />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </DarkModeProvider>
    </I18nProvider>
  );
}

export default App;

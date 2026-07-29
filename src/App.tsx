import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LandingPage from '@/pages/LandingPage';
import SearchPage from '@/pages/SearchPage';
import ProviderProfilePage from '@/pages/ProviderProfilePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import MessagesPage from '@/pages/MessagesPage';
import FavoritesPage from '@/pages/FavoritesPage';
import ProviderDashboardPage from '@/pages/ProviderDashboardPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';

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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
                  <Route path="/provider/dashboard" element={<ProviderDashboardPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="*" element={<LandingPage />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

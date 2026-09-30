import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-orange-600 opacity-20">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">🔍</div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page non trouvée
        </h1>
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Suggested Actions */}
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Accueil
          </button>

          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5" />
            Rechercher un prestataire
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Besoin d'aide ? Contactez-nous :</p>
          <p className="mt-1">
            <a href="mailto:contact@servio.com" className="text-orange-600 hover:underline">
              contact@servio.com
            </a>
          </p>
          <p className="mt-1">
            <a href="tel:+237657029080" className="text-orange-600 hover:underline">
              +237 657 029 080
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

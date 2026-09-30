import { Clock, Mail, Phone } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-8">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-12 h-12 text-orange-600 animate-pulse" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Maintenance en cours
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Nous améliorons SERVIO pour mieux vous servir. L'application sera de nouveau disponible très prochainement.
        </p>

        {/* Info Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-sm">1</span>
              </div>
              <p className="text-left text-gray-700">
                Amélioration des performances de la plateforme
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-sm">2</span>
              </div>
              <p className="text-left text-gray-700">
                Mise à jour du système de paiement
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-sm">3</span>
              </div>
              <p className="text-left text-gray-700">
                Amélioration de la sécurité
              </p>
            </div>
          </div>
        </div>

        {/* ETA */}
        <div className="bg-orange-50 rounded-lg p-4 mb-8">
          <p className="text-orange-800 font-medium">
            ⏱️ Temps estimé de retour : 2-3 heures
          </p>
          <p className="text-orange-600 text-sm mt-1">
            (Mise à jour : 30 Septembre 2026)
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <p className="text-gray-600">Besoin d'aide ? Contactez-nous :</p>
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <Mail className="w-4 h-4" />
            <a href="mailto:contact@servio.com" className="text-orange-600 hover:underline">
              contact@servio.com
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <Phone className="w-4 h-4" />
            <a href="tel:+237657029080" className="text-orange-600 hover:underline">
              +237 657 029 080
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-gray-500">
          <p>© 2026 SERVIO. Tous droits réservés.</p>
          <p className="mt-1">Merci de votre patience !</p>
        </div>
      </div>
    </div>
  );
}

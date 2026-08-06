import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white">
              <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20">
                <Briefcase size={18} className="sm:size-20" />
              </span>
              <span>SERVIO</span>
            </div>
            <p className="mt-3 sm:mt-4 max-w-md text-xs sm:text-sm leading-relaxed text-neutral-300">
              La plateforme qui connecte les prestataires de services avec les clients
              qui les recherchent. Tous secteurs d'activité, partout au monde.
            </p>
            <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
              <a href="mailto:contact@servio.com" className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300 transition-colors hover:text-primary-300">
                <Mail size={14} className="sm:size-16" /> contact@servio.com
              </a>
              <a href="tel:+237657029080" className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300 transition-colors hover:text-primary-300">
                <Phone size={14} className="sm:size-16" /> +237 657 029 080
              </a>
              <a href="tel:+237620972579" className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300 transition-colors hover:text-primary-300">
                <Phone size={14} className="sm:size-16" /> +237 620 972 579
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-sm">
            <h3 className="text-xs sm:text-sm font-semibold text-white">Plateforme</h3>
            <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
              <li><Link to="/search" className="text-xs sm:text-sm text-neutral-300 transition-colors hover:text-primary-300">Explorer les prestataires</Link></li>
              <li><Link to="/signup" className="text-xs sm:text-sm text-neutral-300 transition-colors hover:text-primary-300">Devenir prestataire</Link></li>
              <li><Link to="/faq" className="text-xs sm:text-sm text-neutral-300 transition-colors hover:text-primary-300">FAQ</Link></li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-sm">
            <h3 className="text-xs sm:text-sm font-semibold text-white">Informations</h3>
            <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
              <li><span className="text-xs sm:text-sm text-neutral-300">Conditions générales</span></li>
              <li><span className="text-xs sm:text-sm text-neutral-300">Confidentialité</span></li>
              <li><span className="text-xs sm:text-sm text-neutral-300">Aide & FAQ</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 border-t border-white/10 pt-4 sm:pt-6 text-center">
          <p className="text-xs sm:text-sm text-neutral-400">© 2026 SERVIO. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

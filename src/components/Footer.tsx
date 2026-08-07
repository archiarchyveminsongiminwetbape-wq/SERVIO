import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white">
      <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4 lg:px-8 py-2 sm:py-3 md:py-4 lg:py-6">
        <div className="grid grid-cols-1 gap-1.5 sm:gap-2 md:gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1 text-[10px] sm:text-xs md:text-sm font-bold text-white">
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20">
                <Briefcase className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5" />
              </span>
              <span>SERVIO</span>
            </div>
            <p className="mt-0.5 sm:mt-1 md:mt-1.5 max-w-md text-[8px] sm:text-[9px] md:text-[10px] leading-relaxed text-neutral-300">
              La plateforme qui connecte les prestataires de services avec les clients
              qui les recherchent. Tous secteurs d'activité, partout au monde.
            </p>
            <div className="mt-0.5 sm:mt-1 md:mt-1.5 space-y-0.25 sm:space-y-0.5 md:space-y-0.5">
              <a href="mailto:contact@servio.com" className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1 text-[8px] sm:text-[9px] md:text-[10px] text-neutral-300 transition-colors hover:text-primary-300">
                <Mail className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5" /> contact@servio.com
              </a>
              <a href="tel:+237657029080" className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1 text-[8px] sm:text-[9px] md:text-[10px] text-neutral-300 transition-colors hover:text-primary-300">
                <Phone className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5" /> +237 657 029 080
              </a>
              <a href="tel:+237620972579" className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1 text-[8px] sm:text-[9px] md:text-[10px] text-neutral-300 transition-colors hover:text-primary-300">
                <Phone className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5" /> +237 620 972 579
              </a>
            </div>
          </div>

          <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-1 sm:p-1.5 md:p-1.5 lg:p-2 backdrop-blur-sm">
            <h3 className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] font-semibold text-white">{t.nav.search}</h3>
            <ul className="mt-0.5 sm:mt-1 md:mt-1 lg:mt-1.5 space-y-0.25 sm:space-y-0.5 md:space-y-0.5 lg:space-y-0.5">
              <li><Link to="/search" className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] text-neutral-300 transition-colors hover:text-primary-300">{t.nav.search}</Link></li>
              <li><Link to="/signup" className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] text-neutral-300 transition-colors hover:text-primary-300">{t.nav.signup}</Link></li>
              <li><Link to="/faq" className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] text-neutral-300 transition-colors hover:text-primary-300">FAQ</Link></li>
            </ul>
          </div>

          <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-1 sm:p-1.5 md:p-1.5 lg:p-2 backdrop-blur-sm">
            <h3 className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] font-semibold text-white">{t.nav.settings}</h3>
            <ul className="mt-0.5 sm:mt-1 md:mt-1 lg:mt-1.5 space-y-0.25 sm:space-y-0.5 md:space-y-0.5 lg:space-y-0.5">
              <li><span className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] text-neutral-300">Conditions générales</span></li>
              <li><span className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] text-neutral-300">Confidentialité</span></li>
              <li><span className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] text-neutral-300">Aide & FAQ</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 border-t border-white/10 pt-1 sm:pt-1.5 md:pt-2 lg:pt-3 text-center">
          <p className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] text-neutral-400">© 2026 SERVIO. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

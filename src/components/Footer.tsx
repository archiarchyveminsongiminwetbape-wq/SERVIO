import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white">
      <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-sm sm:text-base md:text-lg font-bold text-white">
              <span className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20">
                <Briefcase size={12} className="sm:size-14 md:size-16 lg:size-20" />
              </span>
              <span>SERVIO</span>
            </div>
            <p className="mt-1.5 sm:mt-2 md:mt-3 max-w-md text-[10px] sm:text-[11px] md:text-xs leading-relaxed text-neutral-300">
              La plateforme qui connecte les prestataires de services avec les clients
              qui les recherchent. Tous secteurs d'activité, partout au monde.
            </p>
            <div className="mt-1.5 sm:mt-2 md:mt-3 space-y-0.5 sm:space-y-1 md:space-y-1.5">
              <a href="mailto:contact@servio.com" className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-[11px] md:text-xs text-neutral-300 transition-colors hover:text-primary-300">
                <Mail size={10} className="sm:size-12 md:size-14" /> contact@servio.com
              </a>
              <a href="tel:+237657029080" className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-[11px] md:text-xs text-neutral-300 transition-colors hover:text-primary-300">
                <Phone size={10} className="sm:size-12 md:size-14" /> +237 657 029 080
              </a>
              <a href="tel:+237620972579" className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-[11px] md:text-xs text-neutral-300 transition-colors hover:text-primary-300">
                <Phone size={10} className="sm:size-12 md:size-14" /> +237 620 972 579
              </a>
            </div>
          </div>

          <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-3 md:p-4 lg:p-5 backdrop-blur-sm">
            <h3 className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-semibold text-white">{t.nav.search}</h3>
            <ul className="mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 space-y-0.5 sm:space-y-1 md:space-y-1.5 lg:space-y-2">
              <li><Link to="/search" className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-neutral-300 transition-colors hover:text-primary-300">{t.nav.search}</Link></li>
              <li><Link to="/signup" className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-neutral-300 transition-colors hover:text-primary-300">{t.nav.signup}</Link></li>
              <li><Link to="/faq" className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-neutral-300 transition-colors hover:text-primary-300">FAQ</Link></li>
            </ul>
          </div>

          <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-3 md:p-4 lg:p-5 backdrop-blur-sm">
            <h3 className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-semibold text-white">{t.nav.settings}</h3>
            <ul className="mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 space-y-0.5 sm:space-y-1 md:space-y-1.5 lg:space-y-2">
              <li><span className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-neutral-300">Conditions générales</span></li>
              <li><span className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-neutral-300">Confidentialité</span></li>
              <li><span className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-neutral-300">Aide & FAQ</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 border-t border-white/10 pt-2 sm:pt-3 md:pt-4 lg:pt-6 text-center">
          <p className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-neutral-400">© 2026 SERVIO. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

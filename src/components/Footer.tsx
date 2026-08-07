import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-white">
      <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl font-bold text-white">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20">
                <Briefcase size={14} className="sm:size-18 md:size-20" />
              </span>
              <span>SERVIO</span>
            </div>
            <p className="mt-2 sm:mt-3 md:mt-4 max-w-md text-[11px] sm:text-xs md:text-sm leading-relaxed text-neutral-300">
              La plateforme qui connecte les prestataires de services avec les clients
              qui les recherchent. Tous secteurs d'activité, partout au monde.
            </p>
            <div className="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-1.5 md:space-y-2">
              <a href="mailto:contact@servio.com" className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-neutral-300 transition-colors hover:text-primary-300">
                <Mail size={12} className="sm:size-14 md:size-16" /> contact@servio.com
              </a>
              <a href="tel:+237657029080" className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-neutral-300 transition-colors hover:text-primary-300">
                <Phone size={12} className="sm:size-14 md:size-16" /> +237 657 029 080
              </a>
              <a href="tel:+237620972579" className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-neutral-300 transition-colors hover:text-primary-300">
                <Phone size={12} className="sm:size-14 md:size-16" /> +237 620 972 579
              </a>
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 md:p-5 backdrop-blur-sm">
            <h3 className="text-[11px] sm:text-xs md:text-sm font-semibold text-white">{t.nav.search}</h3>
            <ul className="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-1.5 md:space-y-2">
              <li><Link to="/search" className="text-[11px] sm:text-xs md:text-sm text-neutral-300 transition-colors hover:text-primary-300">{t.nav.search}</Link></li>
              <li><Link to="/signup" className="text-[11px] sm:text-xs md:text-sm text-neutral-300 transition-colors hover:text-primary-300">{t.nav.signup}</Link></li>
              <li><Link to="/faq" className="text-[11px] sm:text-xs md:text-sm text-neutral-300 transition-colors hover:text-primary-300">FAQ</Link></li>
            </ul>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 md:p-5 backdrop-blur-sm">
            <h3 className="text-[11px] sm:text-xs md:text-sm font-semibold text-white">{t.nav.settings}</h3>
            <ul className="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-1.5 md:space-y-2">
              <li><span className="text-[11px] sm:text-xs md:text-sm text-neutral-300">Conditions générales</span></li>
              <li><span className="text-[11px] sm:text-xs md:text-sm text-neutral-300">Confidentialité</span></li>
              <li><span className="text-[11px] sm:text-xs md:text-sm text-neutral-300">Aide & FAQ</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 md:mt-8 border-t border-white/10 pt-3 sm:pt-4 md:pt-6 text-center">
          <p className="text-[11px] sm:text-xs md:text-sm text-neutral-400">© 2026 SERVIO. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

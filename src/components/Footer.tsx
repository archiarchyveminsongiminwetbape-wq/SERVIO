import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone } from 'lucide-react';
import { memo } from 'react';
import { useI18n } from '@/context/I18nContext';

function Footer() {
  const { t, isRTL } = useI18n();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-xl font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Briefcase size={20} />
              </span>
              <span className="text-neutral-900">SERVIO</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-600">
              {t.search.subtitle}
            </p>
            <div className="mt-4 space-y-2">
              <a href="mailto:contact@servio.com" className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600">
                <Mail size={16} /> contact@servio.com
              </a>
              <a href="tel:+237657029080" className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600">
                <Phone size={16} /> +237 657 029 080
              </a>
              <a href="tel:+237620972579" className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600">
                <Phone size={16} /> +237 620 972 579
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Plateforme</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/search" className="text-sm text-neutral-600 hover:text-primary-600">{t.search.title}</Link></li>
              <li><Link to="/signup" className="text-sm text-neutral-600 hover:text-primary-600">{t.auth.signup}</Link></li>
              <li><Link to="/faq" className="text-sm text-neutral-600 hover:text-primary-600">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{t.user.terms}</h3>
            <ul className="mt-4 space-y-2">
              <li><span className="text-sm text-neutral-600">{t.user.terms}</span></li>
              <li><span className="text-sm text-neutral-600">{t.user.privacy}</span></li>
              <li><span className="text-sm text-neutral-600">{t.user.settings}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 border-t border-neutral-200 pt-4 sm:pt-6 text-center">
          <p className="text-xs sm:text-sm text-neutral-500">© 2026 SERVIO. {t.common.all} {t.common.submit}.</p>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);

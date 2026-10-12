import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { memo } from 'react';
import { useI18n } from '@/context/I18nContext';
import { useDarkMode } from '@/context/DarkModeContext';

function Footer() {
  const { t, isRTL } = useI18n();
  const { darkMode } = useDarkMode();
  const mutedText = darkMode ? 'text-neutral-300' : 'text-neutral-600';
  const headingText = darkMode ? 'text-white' : 'text-neutral-900';

  return (
    <footer className={`border-t ${darkMode ? 'border-white/10 bg-slate-950' : 'border-neutral-200 bg-white/80'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
              <img
                src="/images/servio-logo.png"
                alt="SERVIO Logo"
                loading="lazy"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover shadow-lg"
              />
              <span className={headingText}>SERVIO</span>
            </div>
            <p className={`mt-4 max-w-md text-sm sm:text-base leading-relaxed ${mutedText}`}>
              {t.search.subtitle}
            </p>
            <div className="mt-4 space-y-2 sm:space-y-3">
              <a href="mailto:contact@servio.com" className={`flex items-center gap-2 text-sm sm:text-base ${mutedText} hover:text-primary-600`}>
                <Mail size={16} /> contact@servio.com
              </a>
              <a href="tel:+237657029080" className={`flex items-center gap-2 text-sm sm:text-base ${mutedText} hover:text-primary-600`}>
                <Phone size={16} /> +237 657 029 080
              </a>
              <a href="tel:+237620972579" className={`flex items-center gap-2 text-sm sm:text-base ${mutedText} hover:text-primary-600`}>
                <Phone size={16} /> +237 620 972 579
              </a>
            </div>
          </div>

          <div>
            <h3 className={`text-sm sm:text-base font-semibold ${headingText}`}>Plateforme</h3>
            <ul className="mt-4 space-y-2 sm:space-y-3">
              <li><Link to="/search" className={`text-sm sm:text-base ${mutedText} hover:text-primary-600`}>{t.search.title}</Link></li>
              <li><Link to="/signup" className={`text-sm sm:text-base ${mutedText} hover:text-primary-600`}>{t.auth.signup}</Link></li>
              <li><Link to="/faq" className={`text-sm sm:text-base ${mutedText} hover:text-primary-600`}>FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className={`text-sm sm:text-base font-semibold ${headingText}`}>{t.user.terms}</h3>
            <ul className="mt-4 space-y-2 sm:space-y-3">
              <li><span className={`text-sm sm:text-base ${mutedText}`}>{t.user.terms}</span></li>
              <li><span className={`text-sm sm:text-base ${mutedText}`}>{t.user.privacy}</span></li>
              <li><span className={`text-sm sm:text-base ${mutedText}`}>{t.user.settings}</span></li>
            </ul>
          </div>
        </div>

        <div className={`mt-8 sm:mt-10 border-t pt-4 sm:pt-6 text-center ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>© 2026 SERVIO. {t.common.all} {t.common.submit}.</p>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export default function LanguageSync() {
  const { profile } = useAuth();
  const { syncLanguageFromProfile } = useI18n();

  useEffect(() => {
    if (profile && (profile as any).language) {
      syncLanguageFromProfile((profile as any).language);
    }
  }, [profile, syncLanguageFromProfile]);

  return null;
}

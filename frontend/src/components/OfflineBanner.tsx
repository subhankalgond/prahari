import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="alert" className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm font-medium px-4 py-2 flex items-center gap-2">
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
      {t('common.offline')}
    </div>
  );
}

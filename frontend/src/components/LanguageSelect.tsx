import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { LANGUAGES, setLanguage } from '../i18n';

export function LanguageSelect({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation();
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Languages className="w-4 h-4 absolute left-3 text-ink-600 pointer-events-none" aria-hidden />
      <select
        aria-label="Language"
        value={i18n.language.startsWith('hi') ? 'hi' : i18n.language.startsWith('kn') ? 'kn' : i18n.language.startsWith('mr') ? 'mr' : 'en'}
        onChange={(e) => setLanguage(e.target.value)}
        className="field-input appearance-none pl-9 pr-8 py-2 text-sm min-h-[40px] cursor-pointer"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}

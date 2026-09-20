import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Mic, Volume2, Square, X, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { answerQuestion, type AssistantContext, type Lang } from '../lib/assistantBrain';
import type { Crop, LibraryEntry, RiskAlert, WeatherResponse } from '../types';
import type { ForecastResponse } from '../pages/SprayAdvisory';

type Status = 'idle' | 'listening' | 'thinking' | 'answered';

const SPEECH_LANG: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', mr: 'mr-IN' };

export default function VoiceAssistant() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [heard, setHeard] = useState('');
  const [answer, setAnswer] = useState<{ text: string; link?: string } | null>(null);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const lang = (i18n.language?.slice(0, 2) ?? 'en') as Lang;

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  async function buildContext(): Promise<AssistantContext> {
    const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);
    const [crops, alerts, weather, forecast, library] = await Promise.all([
      safe(api.get<{ crops: Crop[] }>('/api/crops').then((r) => r.crops ?? []), [] as Crop[]),
      safe(api.get<{ alerts: RiskAlert[] }>('/api/alerts').then((r) => r.alerts ?? []), [] as RiskAlert[]),
      safe(api.get<WeatherResponse>('/api/weather'), null as WeatherResponse | null),
      safe(api.get<ForecastResponse>('/api/forecast?location=Karnataka'), null as ForecastResponse | null),
      safe(api.get<{ entries: LibraryEntry[] }>('/api/diseases').then((r) => r.entries ?? []), [] as LibraryEntry[]),
    ]);
    return { lang, userName: user?.name?.split(' ')[0] ?? '', crops, alerts, weather, forecast, library };
  }

  function speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LANG[lang] ?? 'en-IN';
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }

  function handleAnswer(text: string) {
    setStatus('thinking');
    setHeard(text);
    buildContext()
      .then((ctx) => {
        const a = answerQuestion(text, ctx);
        setAnswer(a);
        setStatus('answered');
        speak(a.text);
      })
      .catch(() => {
        setError(t('assistant.error'));
        setStatus('idle');
      });
  }

  function startListening() {
    setError('');
    setHeard('');
    setAnswer(null);
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError(t('assistant.micUnsupported'));
      return;
    }
    const rec = new SR();
    rec.lang = SPEECH_LANG[lang] ?? 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? '';
      if (text) handleAnswer(text);
    };
    rec.onerror = (e: any) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        setError(t('assistant.micDenied'));
      } else {
        setError(t('assistant.micError'));
      }
      setStatus('idle');
    };
    rec.onend = () => {
      setStatus((s) => (s === 'listening' ? 'idle' : s));
    };
    recognitionRef.current = rec;
    setStatus('listening');
    rec.start();
  }

  function stopEverything() {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setStatus('idle');
  }

  // Basic focus trap: Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopEverything();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t('assistant.open')}
          className="fixed z-50 bottom-24 md:bottom-6 right-4 md:right-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-700 text-white shadow-lg hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-700"
        >
          <MessageCircle className="w-6 h-6" aria-hidden />
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t('assistant.open')}
          className="fixed z-50 bottom-24 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] max-w-sm card p-5 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-ink-900">{t('assistant.title')}</p>
            <button
              onClick={() => {
                stopEverything();
                setOpen(false);
              }}
              aria-label={t('assistant.close')}
              className="p-1.5 rounded-lg text-ink-500 hover:bg-stone-100"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>

          {status === 'idle' && !answer && (
            <p className="text-sm text-ink-600">{t('assistant.hint')}</p>
          )}

          {heard && status !== 'listening' && (
            <p className="mt-2 text-sm text-ink-500 border-l-2 border-stone-300 pl-3">{heard}</p>
          )}

          {answer && (
            <div className="mt-3 rounded-xl bg-primary-50 border border-primary-100 p-3">
              <p className="text-sm text-ink-900 leading-relaxed">{answer.text}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => speak(answer.text)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 hover:underline"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden />
                  {t('assistant.repeat')}
                </button>
                {answer.link && (
                  <button
                    onClick={() => {
                      stopEverything();
                      setOpen(false);
                      navigate(answer.link!);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-800 hover:underline"
                  >
                    {t('assistant.view')} 
                  </button>
                )}
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            {status === 'listening' ? (
              <span className="inline-flex items-center gap-2 text-sm text-red-700 font-medium" role="status">
                <Mic className="w-4 h-4 animate-pulse" aria-hidden />
                {t('assistant.listening')}
              </span>
            ) : (
              <button
                onClick={startListening}
                aria-label={t('assistant.ask')}
                className="inline-flex items-center gap-2 rounded-full bg-primary-700 text-white pl-3 pr-4 py-2.5 text-sm font-semibold hover:bg-primary-800 min-h-[44px] disabled:opacity-50"
              >
                <Mic className="w-4 h-4" aria-hidden />
                {t('assistant.ask')}
              </button>
            )}
            {speaking && (
              <button
                onClick={stopEverything}
                aria-label={t('assistant.stop')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:underline"
              >
                <Square className="w-4 h-4" aria-hidden />
                {t('assistant.stop')}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

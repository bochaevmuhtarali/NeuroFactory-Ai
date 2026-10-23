import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { CompanyLogo } from './CompanyLogo';
import {
  X,
  Lock,
  Mail,
  Building2,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLoginSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language, onLoginSuccess }) => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    error,
    clearError,
    isLoading,
  } = useAuth();

  const t = translations[language];
  const [tab, setTab] = useState<'login' | 'register' | 'reset'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [factoryName, setFactoryName] = useState('');
  const [region, setRegion] = useState('г. Тараз');
  const [customCity, setCustomCity] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);

  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const effectiveRegion = isCustomCity && customCity.trim() ? customCity.trim() : (region || 'г. Тараз');
  const effectiveFactoryName = factoryName.trim() || (language === 'kz' ? 'Өндірістік кешен' : 'Производственный комплекс');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setResetSuccessMessage(null);
    setInfoNotice(null);

    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
        onClose();
        onLoginSuccess?.();
      } else if (tab === 'register') {
        try {
          await registerWithEmail(email, password, effectiveFactoryName, effectiveRegion);
          onClose();
          onLoginSuccess?.();
        } catch (regErr: any) {
          const errStr = String(regErr?.code || (regErr instanceof Error ? regErr.message : ''));
          if (errStr.includes('email-already-in-use')) {
            clearError();
            // Attempt seamless login with entered password if valid
            try {
              await loginWithEmail(email, password);
              onClose();
              onLoginSuccess?.();
              return;
            } catch {
              // Stay on current tab - do NOT kick user to login tab automatically!
              clearError();
              setInfoNotice(
                language === 'kz'
                  ? `«${email}» поштасымен аккаунт бұрыннан тіркелген. Егер бұл сіздің аккаунтыңыз болса, төмендегі батырмамен кіруге өтіңіз немесе басқа email енгізіңіз.`
                  : `Аккаунт с почтой «${email}» уже зарегистрирован. Если это ваш существующий аккаунт, перейдите ко входу ниже или укажите другой email для нового завода.`
              );
            }
          }
        }
      } else if (tab === 'reset') {
        await sendPasswordReset(email);
        setResetSuccessMessage(t.auth.verificationSent);
      }
    } catch {
      // Error handled by AuthContext
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      clearError();
      await loginWithGoogle();
      onClose();
      onLoginSuccess?.();
    } catch {
      // Error handled by AuthContext
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto max-h-[92dvh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label={t.common.close}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto p-5 sm:p-6 no-scrollbar">

        {/* Modal Header */}
        <div className="mb-5">
          <div className="mb-3">
            <CompanyLogo size="md" withText={true} glow={true} />
          </div>
          <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <Lock className="h-4 w-4" />
            <span>Firebase Authentication · ABAC</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {tab === 'login' && t.auth.loginPromptTitle}
            {tab === 'register' && t.auth.register}
            {tab === 'reset' && t.auth.resetPassword}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.auth.authNotice}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-lg bg-slate-950 p-1 mb-4 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              clearError();
              setResetSuccessMessage(null);
              setInfoNotice(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'login'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.auth.login}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              clearError();
              setResetSuccessMessage(null);
              setInfoNotice(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'register'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.auth.register}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('reset');
              clearError();
              setResetSuccessMessage(null);
              setInfoNotice(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'reset'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.auth.resetPassword}
          </button>
        </div>

        {/* Info Notice (e.g. Email Already Registered) */}
        {infoNotice && (
          <div className="mb-4 rounded-lg bg-amber-950/40 border border-amber-600/50 p-3 text-xs text-amber-200 flex flex-col gap-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1 leading-relaxed">{infoNotice}</div>
            </div>
            {tab === 'register' && (
              <div className="flex items-center gap-2 pt-2 border-t border-amber-800/40">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    clearError();
                    setInfoNotice(null);
                  }}
                  className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 font-semibold transition-colors"
                >
                  {language === 'kz' ? 'Жүйеге кіруге өту' : 'Перейти ко входу'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('reset');
                    clearError();
                    setInfoNotice(null);
                  }}
                  className="px-2.5 py-1 text-slate-300 hover:text-white transition-colors underline"
                >
                  {language === 'kz' ? 'Құпия сөзді ұмыттыңыз ба?' : 'Забыли пароль?'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error / Success Notices */}
        {error && (
          <div className="mb-4 rounded-lg bg-rose-950/50 border border-rose-800 p-3 text-xs text-rose-300 flex flex-col gap-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>

            {error.includes('Authorized domains') && (
              <div className="rounded-lg bg-slate-950/90 border border-slate-800 p-3 space-y-2 mt-1">
                <div className="text-[11px] text-slate-300 font-semibold flex items-center justify-between">
                  <span>{language === 'kz' ? 'Қосу керек домен:' : 'Домен для добавления:'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.hostname);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2000);
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono hover:bg-cyan-900 transition-colors cursor-pointer"
                  >
                    {copiedDomain ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedDomain ? (language === 'kz' ? 'Көшірілді' : 'Скопировано') : (language === 'kz' ? 'Көшіру' : 'Копировать')}</span>
                  </button>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-400 select-all break-all">
                  {typeof window !== 'undefined' ? window.location.hostname : ''}
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                  <a
                    href="https://console.firebase.google.com/project/celestial-ellipse-701dl/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-semibold text-amber-300 transition-colors"
                  >
                    <span>Firebase Console</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('bochaevmuhtarali@gmail.com');
                      setPassword('Muha1122p');
                      setTab('login');
                      clearError();
                    }}
                    className="flex-1 py-2 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {language === 'kz' ? 'Email арқылы кіру' : 'Войти через Email'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {resetSuccessMessage && (
          <div className="mb-4 rounded-lg bg-emerald-950/50 border border-emerald-800 p-3 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="flex-1">{resetSuccessMessage}</div>
          </div>
        )}

        {/* Prominent Google Sign-In (Instantly visible without scrolling) */}
        {tab !== 'reset' && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 hover:border-cyan-500/50 py-2.5 px-4 text-xs font-bold text-white transition-all shadow-sm group cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.auth.googleSignIn}</span>
            </button>

            <div className="relative flex items-center justify-center my-3.5">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                {language === 'kz' ? 'немесе email арқылы' : 'или через email и пароль'}
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <>
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>{t.auth.factoryName}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {language === 'kz' ? 'бос қалса: Өндірістік кешен' : 'если не указано: Производственный комплекс'}
                  </span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-cyan-400" />
                  <input
                    type="text"
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    placeholder={language === 'kz' ? 'Мысалы: Өндірістік кешен, Казфосфат...' : 'Например: Производственный комплекс, ТОО «Казфосфат»...'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    {language === 'kz' ? 'Зауыт орналасқан қала / аймақ *' : 'Город / Регион расположения завода *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCity(!isCustomCity)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {isCustomCity
                      ? (language === 'kz' ? 'Тізімнен таңдау' : 'Выбрать из списка')
                      : (language === 'kz' ? '+ Басқа қала' : '+ Другой город')}
                  </button>
                </div>

                {!isCustomCity ? (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                    >
                      {t.regions.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder={language === 'kz' ? 'Қала атауын жазыңыз (мыс. г. Тараз)' : 'Введите город (напр. г. Тараз)'}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Live Preview of Plant Digital Twin Status */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950/90 p-3 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{language === 'kz' ? 'Диспетчерлік тақтада көрсетіледі:' : 'Отображение в диспетчерской:'}</span>
                  </span>
                  <span className="text-emerald-400 font-bold">ONLINE</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-300">
                  <span className="font-bold text-white">{effectiveFactoryName}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-300 font-semibold">{effectiveRegion}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{language === 'kz' ? 'Диспетчерлік онлайн (Потоки активны)' : 'Диспетчерская онлайн (Потоки активны)'}</span>
                  </span>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.auth.email} *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@enterprise.kz"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {tab !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  {t.auth.password} *
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => setTab('reset')}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    {t.auth.forgotPassword}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={6}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-white transition-colors"
                  title={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-cyan-500 focus:outline-none disabled:opacity-50 transition-colors shadow-sm"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === 'login' && t.auth.login}
            {tab === 'register' && t.auth.register}
            {tab === 'reset' && t.auth.sendResetLink}
          </button>
        </form>

        </div>
      </div>
    </div>
  );
};

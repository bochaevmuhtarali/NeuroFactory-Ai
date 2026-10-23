import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import {
  X,
  Building2,
  MapPin,
  Briefcase,
  User,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Database,
  Cloud,
  LogOut,
  ShieldAlert,
  LifeBuoy,
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onOpenAdminProfile?: () => void;
  onOpenSupport?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  language,
  onOpenAdminProfile,
  onOpenSupport,
}) => {
  const {
    currentUser,
    profile,
    saveFactoryProfile,
    setHardwareConnectedState,
    resendVerificationEmail,
    logout,
    isAdmin,
    isLoading,
    isFirebaseReady,
  } = useAuth();

  const t = translations[language];

  const [factoryName, setFactoryName] = useState('');
  const [region, setRegion] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [industrySector, setIndustrySector] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (profile) {
      setFactoryName(profile.factoryName || 'Производственный комплекс');
      const currentRegion = profile.region || 'г. Тараз';
      setRegion(currentRegion);
      if (!t.regions.includes(currentRegion)) {
        setIsCustomCity(true);
        setCustomCity(currentRegion);
      }
      setIndustrySector(profile.industrySector || t.industries[0]);
      setContactPerson(profile.contactPerson || '');
      setContactPhone(profile.contactPhone || '');
    }
  }, [profile, t.regions, t.industries]);

  if (!isOpen || !currentUser) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error logging out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaved(false);

    const effectiveRegion = isCustomCity && customCity.trim() ? customCity.trim() : (region || 'г. Тараз');
    const effectiveFactory = factoryName.trim() || 'Производственный комплекс';

    try {
      await saveFactoryProfile({
        factoryName: effectiveFactory,
        region: effectiveRegion,
        industrySector,
        contactPerson,
        contactPhone,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error updating profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto max-h-[92dvh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
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
            <Building2 className="h-4 w-4" />
            <span>Cloud Firestore — /factories/{currentUser.uid.substring(0, 10)}...</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t.auth.factoryName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.auth.profileDescription}
          </p>
        </div>

        {/* User Account / Session Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{currentUser.email || 'Инженер предприятия'}</span>
                {profile?.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="h-3 w-3" />
                    {t.auth.verified}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                UID: {currentUser.uid}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenSupport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSupport();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                title="Написать обращение основателю платформы"
              >
                <LifeBuoy className="h-3.5 w-3.5 text-cyan-400" />
                <span>Техподдержка</span>
              </button>
            )}

            {isAdmin && onOpenAdminProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminProfile();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-colors"
                title="Перейти в личный профиль администратора"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span>{t.nav.adminBadge}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading || isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/50 bg-rose-950/30 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 hover:text-white hover:border-rose-700 transition-colors"
              title={t.auth.logout}
            >
              {isLoggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
              ) : (
                <LogOut className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span>{t.auth.logout}</span>
            </button>
          </div>
        </div>

        {/* Cloud Security Indicator */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div>
              <span className="font-semibold text-slate-200">Zero-Trust Isolation: </span>
              <span className="text-slate-400">UID matches request.auth.uid</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>Firestore Rules: OK</span>
          </div>
        </div>

        {/* Verification Alert Banner */}
        {!profile?.emailVerified && (
          <div className="mb-5 flex items-center justify-between rounded-lg bg-amber-950/40 border border-amber-800/80 p-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{t.auth.unverified} ({currentUser.email})</span>
            </div>
            <button
              type="button"
              onClick={resendVerificationEmail}
              disabled={isLoading}
              className="text-xs text-amber-300 hover:text-white underline font-medium ml-2 shrink-0"
            >
              {t.auth.resendVerification}
            </button>
          </div>
        )}

        {isSaved && (
          <div className="mb-4 rounded-lg bg-emerald-950/60 border border-emerald-800 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{t.auth.savedSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="mb-4 rounded-lg bg-rose-950/60 border border-rose-800 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.auth.factoryName} *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  {language === 'kz' ? 'Қала / Аймақ *' : 'Город / Регион *'}
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
                    placeholder={language === 'kz' ? 'Қала атауын енгізіңіз (мыс. г. Тараз)' : 'Введите город (напр. г. Тараз)'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.auth.industrySector}
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  value={industrySector}
                  onChange={(e) => setIndustrySector(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {t.industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.auth.contactPerson}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Даулетов Асылбек"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.auth.contactPhone}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+7 (7212) 99-88-77"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Telemetry Hardware Mode Toggle */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <span className={`h-2 w-2 rounded-full ${profile?.hasConnectedHardware ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>
                  {profile?.hasConnectedHardware
                    ? (language === 'kz' ? 'Жабдықтар қосулы (Диспетчерлік онлайн)' : 'Оборудование подключено (Потоки активны)')
                    : (language === 'kz' ? 'Таза нөлдік күй (0 камера, көрсеткіштер бос)' : 'Чистое нулевое состояние (0 камер, показатели пусты)')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {profile?.hasConnectedHardware
                  ? (language === 'kz' ? 'Жүйеде демонстрациялық деректер қосылған' : 'В системе активны потоки оборудования')
                  : (language === 'kz' ? 'Жаңа аккаунт: деректер тек нақты жабдық қосылғанда шығады' : 'Новый аккаунт: камеры и датчики не подключены')}
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                const targetState = !profile?.hasConnectedHardware;
                await setHardwareConnectedState(targetState);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                profile?.hasConnectedHardware
                  ? 'border-amber-600/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                  : 'border-emerald-600/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
              }`}
            >
              {profile?.hasConnectedHardware
                ? (language === 'kz' ? 'Нөлдік күйге ауыстыру (0 камера)' : 'Сбросить до 0 камер (Очистить)')
                : (language === 'kz' ? 'Демо ағындарын қосу' : 'Подключить демо-потоки')}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading || isLoggingOut}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-rose-900/50 bg-rose-950/20 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 hover:text-rose-100 hover:border-rose-600 transition-colors"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
              ) : (
                <LogOut className="h-4 w-4 text-rose-400" />
              )}
              <span>{t.auth.logout}</span>
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isLoading || isLoggingOut}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isLoading ? t.auth.saving : t.auth.saveProfile}</span>
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

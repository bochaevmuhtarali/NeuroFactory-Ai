import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import {
  ShieldCheck,
  Leaf,
  Activity,
  Layers,
  Bot,
  Building2,
  LogIn,
  CheckCircle2,
  Cpu,
  Menu,
  X,
  ChevronRight,
  MapPin,
  Sparkles,
  ShieldAlert,
  Volume2,
  VolumeX,
  FileText,
  PlusCircle,
  LifeBuoy,
} from 'lucide-react';
import { isAudioEnabled, setAudioEnabled, playPingSound } from '../utils/industrialAudio';
import { CompanyLogo } from './CompanyLogo';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAdminProfile?: () => void;
  onOpenAdminProfileWithTab?: (tab: 'general' | 'telemetry' | 'system' | 'audit' | 'tickets') => void;
  onOpenSupport?: () => void;
  openTicketsCount?: number;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onReplaySplash?: () => void;
  onOpenReport?: () => void;
  onOpenConnectHardware?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  onOpenAuth,
  onOpenProfile,
  onOpenAdminProfile,
  onOpenAdminProfileWithTab,
  onOpenSupport,
  openTicketsCount = 0,
  onToggleChat,
  isChatOpen,
  onReplaySplash,
  onOpenReport,
  onOpenConnectHardware,
}) => {
  const { currentUser, profile, isAdmin } = useAuth();
  const t = translations[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => isAudioEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setAudioEnabled(next);
    if (next) playPingSound();
  };

  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  const navCatalog = [
    {
      id: 'overview',
      name: t.nav.overview,
      icon: Layers,
      badge: null,
      desc: language === 'kz' ? 'Өндірістік ЖИ кешені' : 'Цифровой двойник предприятия',
    },
    {
      id: 'safevision',
      name: t.nav.safevision,
      icon: ShieldCheck,
      badge: 'YOLOv11',
      desc: language === 'kz' ? 'ЖҚҚ детекциясы және қауіпті аймақтар' : 'Контроль СИЗ и крановых зон',
    },
    {
      id: 'ecopredict',
      name: t.nav.ecopredict,
      icon: Leaf,
      badge: 'LSTM ПДК',
      desc: language === 'kz' ? 'SO₂, CO, NO₂ газдарын бақылау' : 'Экология и предупреждение залпов',
    },
    {
      id: 'failpredict',
      name: t.nav.failpredict,
      icon: Activity,
      badge: 'ISO 10816',
      desc: language === 'kz' ? 'Діріл диагностикасы және RUL' : 'Вибродиагностика и расчет ресурса',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavClick('overview')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
              aria-label="NeuroFactory AI Главная"
            >
              <CompanyLogo size="sm" withText={true} glow={true} />
            </button>
          </div>

          {/* Desktop Navigation Links (hidden on mobile) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider">
            {navCatalog.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Language Switcher, Chat Toggle, Profile/Auth, Mobile Hamburger) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Switcher (Desktop) */}
            <div className="hidden sm:flex items-center rounded-md border border-slate-800 bg-slate-900/90 p-0.5 text-xs font-mono">
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'ru'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Переключить на русский язык"
              >
                RU
              </button>
              <span className="text-slate-700">|</span>
              <button
                onClick={() => setLanguage('kz')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'kz'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Қазақ тіліне ауыстыру"
              >
                KZ
              </button>
            </div>

            {/* AI Assistant Button (Free) */}
            <button
              onClick={onToggleChat}
              className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                isChatOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold shadow-sm'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/50 hover:text-white'
              }`}
              aria-label="Открыть бесплатный ИИ-ассистент"
              title="Бесплатный инженерный ИИ-консультант"
            >
              <Bot className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t.nav.assistant}</span>
              <span className="hidden xl:inline text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                Free
              </span>
            </button>

            {/* Official Report Generator (GOST / Ministry) */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 text-xs text-slate-200 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors shadow-xs shrink-0"
                title="Сформировать официальный акт нарушений и экологический рапорт РК"
              >
                <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>{language === 'kz' ? 'Акт / Есеп' : 'Акты РК'}</span>
              </button>
            )}

            {/* Founder/Admin Direct Tickets Inbox Badge */}
            {isAdmin && onOpenAdminProfile && (
              <button
                onClick={() => {
                  if (onOpenAdminProfileWithTab) onOpenAdminProfileWithTab('tickets');
                  else onOpenAdminProfile();
                }}
                className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/30 text-xs font-semibold text-amber-300 hover:bg-amber-950/50 hover:border-amber-400 transition-all shadow-xs shrink-0"
                title="Входящие заявки техподдержки от пользователей и цехов"
              >
                <LifeBuoy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline">Заявки</span>
                {openTicketsCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-500 text-white font-bold animate-pulse">
                    {openTicketsCount}
                  </span>
                ) : null}
              </button>
            )}

            {/* User Profile / Auth Button (Visible and perfectly fitted on ALL devices including mobile!) */}
            <div className="shrink-0">
              {currentUser ? (
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-200 hover:border-cyan-500/50 hover:text-white transition-all shadow-sm"
                  title={profile?.factoryName || t.nav.profile}
                  aria-label={t.nav.profile}
                >
                  <Building2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="hidden md:inline max-w-[130px] truncate font-medium">
                    {profile?.factoryName || t.nav.profile}
                  </span>
                  {profile?.emailVerified && (
                    <span title={t.auth.verified} className="inline-flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
                  title={t.auth.login}
                  aria-label={t.auth.login}
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{t.auth.login}</span>
                </button>
              )}
            </div>

            {/* Menu Hamburger Button (3 lines - modern menu) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:text-cyan-300 hover:border-cyan-500 transition-colors shrink-0"
              aria-label={language === 'kz' ? 'Мәзір мен каталогты ашу' : 'Открыть меню и каталог'}
              title={language === 'kz' ? 'Мәзір мен құралдар' : 'Меню и инструменты'}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-cyan-400" />
              ) : (
                <Menu className="h-5 w-5 text-slate-200" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modern Navigation Catalog & Tools Drawer (slideout) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-out Menu Sheet */}
          <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-slate-900 border-l border-slate-800 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar z-10 animate-in slide-in-from-right duration-250">
            {/* Top Brand & Close Bar */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <CompanyLogo size="xs" withText={true} glow={true} subtitle={language === 'kz' ? 'Өндірістік каталог' : 'Промышленный каталог'} />

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Factory Profile Quick Bar (only for authenticated enterprise users) */}
              {currentUser && profile && (
                <div className="my-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-white truncate">
                      {profile.factoryName || (language === 'kz' ? 'Өндірістік кешен' : 'Производственный комплекс')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-850">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="h-3 w-3 text-emerald-400" />
                      <span>{profile.region || 'г. Тараз'}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      profile.hasConnectedHardware ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        profile.hasConnectedHardware ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`} />
                      {profile.hasConnectedHardware
                        ? (language === 'kz' ? 'Диспетчерлік онлайн (Потоки активны)' : 'Диспетчерская онлайн (Потоки активны)')
                        : (language === 'kz' ? 'Әзірге ештеңе қосылмаған' : 'Пока ничего не подключено')}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Modules Catalog */}
              <div className="space-y-1.5 mb-6">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 font-mono">
                  {language === 'kz' ? 'Негізгі модульдер' : 'Модули платформы'}
                </div>

                {navCatalog.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        isActive
                          ? 'border-cyan-500/50 bg-cyan-950/30 text-white shadow-sm'
                          : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/60 text-slate-400'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </button>
                  );
                })}
              </div>

              {/* Secondary Actions: Sound, Assistant, Boot Test, Language */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {/* Industrial Audio Siren Toggle */}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    soundOn
                      ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white'
                  }`}
                  title={soundOn ? 'Промышленная звуковая сигнализация включена' : 'Звук сигнализации отключен'}
                >
                  <div className="flex items-center gap-2.5">
                    {soundOn ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                    <span>{language === 'kz' ? 'Өндірістік дабыл дыбысы' : 'Звук сигнализации'}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                    soundOn ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}>
                    {soundOn ? (language === 'kz' ? 'ҚОСУЛЫ' : 'ВКЛ') : (language === 'kz' ? 'ӨШІРУЛІ' : 'ВЫКЛ')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onToggleChat();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-200 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="h-4 w-4 text-cyan-400" />
                    <span>{t.nav.assistant}</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                    Free AI
                  </span>
                </button>

                {onOpenReport && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenReport();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs font-medium text-slate-200 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <span>{language === 'kz' ? 'Акт және есептер (ГОСТ / ПДК)' : 'Акты расследования и отчеты (ГОСТ)'}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                      PDF
                    </span>
                  </button>
                )}

                {onOpenConnectHardware && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenConnectHardware();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs font-medium text-slate-200 hover:text-emerald-300 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlusCircle className="h-4 w-4 text-emerald-400" />
                      <span>{language === 'kz' ? 'Жабдықты қосу (RTSP/Modbus)' : 'Подключить оборудование (Edge)'}</span>
                    </div>
                  </button>
                )}

                {onOpenSupport && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenSupport();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs font-medium text-slate-200 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <LifeBuoy className="h-4 w-4 text-cyan-400" />
                      <span>{language === 'kz' ? 'Техникалық қолдау' : 'Техподдержка (Заявка основателю)'}</span>
                    </div>
                  </button>
                )}

                {/* Mobile Diagnostic Re-Boot Loader Button - Only visible when logged in */}
                {currentUser && onReplaySplash && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onReplaySplash();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cpu className="h-4 w-4 text-cyan-400" />
                      <span>{language === 'kz' ? 'Ядролық бут-тест' : 'Запустить бут-тест ядра'}</span>
                    </div>
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  </button>
                )}

                {isAdmin && onOpenAdminProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenAdminProfileWithTab) onOpenAdminProfileWithTab('tickets');
                      else onOpenAdminProfile();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 text-xs font-semibold text-amber-300 hover:bg-amber-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <LifeBuoy className="h-4 w-4 text-amber-400" />
                      <span>Заявки техподдержки</span>
                    </div>
                    {openTicketsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-500 text-white font-bold animate-pulse">
                        {openTicketsCount} новых
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bottom User Session & Language Section */}
            <div className="pt-4 border-t border-slate-800 mt-4 space-y-3">
              {/* Account Button */}
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                >
                  <Building2 className="h-4 w-4 text-cyan-400" />
                  <span>{t.nav.profile}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{t.auth.login}</span>
                </button>
              )}

              {/* Language Switcher Bar on Mobile */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setLanguage('ru')}
                  className={`flex-1 py-1.5 rounded-md text-center font-semibold transition-colors ${
                    language === 'ru'
                      ? 'bg-cyan-500/20 text-cyan-300 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Русский (RU)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('kz')}
                  className={`flex-1 py-1.5 rounded-md text-center font-semibold transition-colors ${
                    language === 'kz'
                      ? 'bg-cyan-500/20 text-cyan-300 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Қазақша (KZ)
                </button>
              </div>

              <div className="text-[10px] text-slate-500 text-center font-mono pt-1">
                NeuroFactory AI · Версия 2.4.0
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

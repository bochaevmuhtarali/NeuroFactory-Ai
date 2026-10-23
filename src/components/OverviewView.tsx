import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import {
  ShieldCheck,
  Leaf,
  Activity,
  ArrowRight,
  Building2,
  MapPin,
  Camera,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

interface OverviewViewProps {
  onNavigate: (tab: string) => void;
  language: Language;
  camerasCount: number;
  sensorsCount: number;
  machinesCount: number;
  isHardwareConnected: boolean;
  onLoadDemoData?: () => void;
  onResetToZero?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  language,
  camerasCount,
  sensorsCount,
  machinesCount,
  isHardwareConnected,
  onLoadDemoData,
  onResetToZero,
}) => {
  const { profile } = useAuth();
  const t = translations[language];

  return (
    <div className="space-y-8">
      {/* Hero Section with Industrial Digital Twin Banner */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="relative aspect-[21/9] sm:aspect-[24/8] min-h-[300px] w-full overflow-hidden">
          <img
            src="/src/assets/images/hero_industrial_plant_1792688516649.jpg"
            alt="NeuroFactory Plant Digital Twin"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          {/* Cybernetic laser scanline */}
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 animate-scanline pointer-events-none" />

          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-md bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 text-xs font-mono font-semibold text-cyan-300">
                <CompanyLogo size="xs" withText={false} glow={true} />
                <span>NeuroFactory Enterprise AI Platform</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {t.overview.heroTitle}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {t.overview.heroSubtitle}
              </p>

              {/* Plant info bar */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 text-xs sm:text-sm text-slate-300 font-mono">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <Building2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>{profile?.factoryName || 'Производственный комплекс'}</span>
                </div>
                <span className="text-slate-600">·</span>
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{profile?.region || 'г. Тараз'}</span>
                </div>
                <span className="text-slate-600">·</span>
                <div className={`flex items-center gap-2 ${profile?.hasConnectedHardware ? 'text-emerald-400' : 'text-amber-400 font-semibold'}`}>
                  <span className={`h-2 w-2 rounded-full ${profile?.hasConnectedHardware ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span>
                    {profile?.hasConnectedHardware
                      ? (language === 'kz' ? 'Диспетчерлік онлайн (Потоки активны)' : 'Диспетчерская онлайн (Потоки активны)')
                      : (language === 'kz' ? 'Әзірге ештеңе қосылмаған' : 'Пока ничего не подключено')}
                  </span>
                </div>
                {isHardwareConnected && onResetToZero && (
                  <button
                    onClick={onResetToZero}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/50 text-[11px] font-mono text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                    title={language === 'kz' ? 'Нөлдік күйге қайтару (Әзірге ештеңе қосылмаған)' : 'Сбросить до 0 устройств (Пока ничего не подключено)'}
                  >
                    <span>{language === 'kz' ? 'Тазарту (0 жабдық)' : 'Сбросить до 0 (Очистить)'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column KPI strip (Dynamic Zero State for new accounts) */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 border-t border-slate-800 bg-slate-950/80 p-4 sm:p-6 text-xs">
          <div className="p-3 space-y-1">
            <div className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>{t.overview.kpiSafety}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {camerasCount > 0 ? '96.4%' : '0%'}
            </div>
            <div className="text-[10px] text-slate-400">
              {camerasCount > 0 ? 'Каски, жилеты, очки в норме' : t.emptyStates.camerasNotConnected}
            </div>
          </div>

          <div className="p-3 space-y-1">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Leaf className="h-4 w-4 text-emerald-400" />
              <span>{t.overview.kpiEco}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">
              {sensorsCount > 0 ? '91.2%' : '0 станций'}
            </div>
            <div className="text-[10px] text-slate-400">
              {sensorsCount > 0 ? 'Концентрации в рамках ПДК РК' : t.emptyStates.sensorsNotConnected}
            </div>
          </div>

          <div className="p-3 space-y-1">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>{t.overview.kpiEquipment}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {machinesCount > 0 ? '86.2%' : '0 ед.'}
            </div>
            <div className="text-[10px] text-slate-400">
              {machinesCount > 0 ? '1 агрегат требует ТО подшипника' : t.emptyStates.machinesNotConnected}
            </div>
          </div>

          <div className="p-3 space-y-1">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-cyan-400" />
              <span>{t.overview.kpiActiveCams}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {camerasCount > 0 ? `${camerasCount} / ${camerasCount}` : '0 / 0'}
            </div>
            <div className="text-[10px] text-slate-400">
              {camerasCount > 0 ? '25-30 FPS инференс YOLOv11' : t.emptyStates.noActiveCameras}
            </div>
          </div>
        </div>
      </div>

      {/* New Account Alert & Telemetry Connection Banner */}
      {!isHardwareConnected && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                {language === 'kz' ? 'Жаңа аккаунт күйі' : 'Статус нового аккаунта'}
              </div>
              <h3 className="text-base font-bold text-white">
                {language === 'kz' ? 'Пока ничего не подключено (Әзірге ештеңе қосылмаған)' : 'Пока ничего не подключено'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                {language === 'kz'
                  ? 'Жаңа аккаунтта өндірістік құрылғылар мен датчиктер әлі қосылмаған. Барлық телеметриялық көрсеткіштер нөлге тең (0 камера, 0 эко-сенсор, 0 агрегат). Жүйені тексеру үшін демо-стендті іске қосыңыз немесе нақты жабдықты жалғаңыз.'
                  : 'На новом аккаунте предприятия внешнее оборудование и датчики еще не подключены. Все показатели телеметрии обнулены (0 камер, 0 эко-датчиков, 0 агрегатов). Вы можете активировать демонстрационный стенд для тестирования работы модулей или подключить промышленное оборудование.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            {onLoadDemoData && (
              <button
                type="button"
                onClick={onLoadDemoData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all shadow-md hover:shadow-cyan-500/20"
              >
                <Sparkles className="h-4 w-4" />
                <span>{t.emptyStates.loadDemoStand}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Three Core Modules Showcase */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Производственные ИИ-модули предприятия
          </h2>
          <p className="text-xs text-slate-400">
            Выберите модуль для перехода к детализированной телеметрии, настройке порогов и журналу событий.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: SafeVision */}
          <div
            onClick={() => onNavigate('safevision')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm hover:border-cyan-500/60 hover:bg-slate-850 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(6,182,212,0.18)] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 group-hover:scale-110 transition-all">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                  SafeVision
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                {t.safevision.title.split('—')[0]}
              </h3>

              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {t.safevision.taskDescription}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Контроль касок и жилетов:</span>
                  <span className="font-mono text-emerald-400 font-semibold">Активен</span>
                </div>
                <div className="flex justify-between">
                  <span>Опасные зоны кранов:</span>
                  <span className="font-mono text-cyan-400 font-semibold">100% покрытие</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:gap-2.5 transition-all">
              <span>{t.overview.openModule}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Module 2: EcoPredict */}
          <div
            onClick={() => onNavigate('ecopredict')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm hover:border-emerald-500/60 hover:bg-slate-850 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400 group-hover:scale-110 transition-all">
                  <Leaf className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  EcoPredict
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {t.ecopredict.title.split('—')[0]}
              </h3>

              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {t.ecopredict.taskDescription}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Газоанализ SO₂, CO, NO₂:</span>
                  <span className="font-mono text-emerald-400 font-semibold">ПДК РК</span>
                </div>
                <div className="flex justify-between">
                  <span>Прогноз залповых рисков:</span>
                  <span className="font-mono text-cyan-400 font-semibold">LSTM 24ч</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:gap-2.5 transition-all">
              <span>{t.overview.openModule}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Module 3: FailPredict */}
          <div
            onClick={() => onNavigate('failpredict')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm hover:border-amber-500/60 hover:bg-slate-850 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:border-amber-400 transition-colors">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  FailPredict
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                {t.failpredict.title.split('—')[0]}
              </h3>

              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {t.failpredict.taskDescription}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Стандарт вибродиагностики:</span>
                  <span className="font-mono text-cyan-400 font-semibold">ISO 10816-3</span>
                </div>
                <div className="flex justify-between">
                  <span>Расчет ресурса RUL:</span>
                  <span className="font-mono text-amber-400 font-semibold">Подшипники</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:gap-2.5 transition-all">
              <span>{t.overview.openModule}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

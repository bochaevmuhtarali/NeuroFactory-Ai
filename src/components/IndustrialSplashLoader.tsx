import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, Leaf, Activity, Cpu, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface IndustrialSplashLoaderProps {
  onComplete: () => void;
  language: Language;
}

export const IndustrialSplashLoader: React.FC<IndustrialSplashLoaderProps> = ({
  onComplete,
  language,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = language === 'kz'
    ? [
        { title: 'YOLOv11 Edge нейрожелісін калибрлеу', desc: 'SafeVision: ЖҚҚ тану және қауіпті аймақтар' },
        { title: 'Газ талдағыштардың Modbus/MQTT шлюзін қосу', desc: 'EcoPredict: SO₂, CO, NO₂, PM2.5/10 ШРК нормалары' },
        { title: 'ISO 10816 діріл спектрін инициализациялау', desc: 'FailPredict: Турбоагрегаттар мен подшипниктердің RUL' },
        { title: 'Cloud Firestore қауіпсіз ядросымен синхрондау', desc: 'Қазақстанның ауыр өнеркәсіп кәсіпорындары желісі' },
        { title: 'Жүйе дайын · Диспетчерлік терминал белсенді', desc: 'NeuroFactory AI өндірістік интеллекты іске қосылды' },
      ]
    : [
        { title: 'Калибровка нейросетевого ядра YOLOv11 Edge', desc: 'SafeVision: Детекция СИЗ и мониторинг опасных зон' },
        { title: 'Подключение Modbus/MQTT шлюзов газоанализа', desc: 'EcoPredict: Контроль ПДК SO₂, CO, NO₂, PM2.5/10' },
        { title: 'Инициализация спектра вибродиагностики ISO 10816', desc: 'FailPredict: Предиктивный расчет RUL агрегатов' },
        { title: 'Синхронизация защищенного ядра Cloud Firestore', desc: 'Изолированный диспетчерский контур предприятий РК' },
        { title: 'Система готова · Промышленный терминал активен', desc: 'Платформа NeuroFactory AI развернута в штатном режиме' },
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Realistic variable speed telemetry loading
        const jump = prev < 30 ? 4 : prev < 70 ? 6 : prev < 90 ? 3 : 2;
        const nextVal = Math.min(100, prev + jump);

        // Update step index based on progress
        if (nextVal >= 88) setStepIndex(4);
        else if (nextVal >= 65) setStepIndex(3);
        else if (nextVal >= 40) setStepIndex(2);
        else if (nextVal >= 18) setStepIndex(1);
        else setStepIndex(0);

        return nextVal;
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(onComplete, 400);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  const currentStep = steps[stepIndex];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.12) 0%, transparent 60%),
          linear-gradient(to right, rgba(15, 23, 42, 0.4) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 32px 32px, 32px 32px',
      }}
    >
      {/* Laser Scanning Line Animation */}
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 animate-scanline pointer-events-none" />

      {/* Main Center Card */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-slate-800/90 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center">
        {/* Ambient Corner Accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/60" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500/60" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500/60" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/60" />

        {/* Central Official Company Logo with Glowing Orbit */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div className="absolute h-32 w-32 rounded-full bg-cyan-500/25 blur-2xl animate-pulse" />
          
          {/* Rotating Ring 1 */}
          <div className="absolute h-28 w-28 rounded-full border border-dashed border-cyan-500/40 animate-[spin_10s_linear_infinite]" />
          
          {/* Rotating Ring 2 (reverse) */}
          <div className="absolute h-24 w-24 rounded-full border border-slate-700/80 animate-[spin_14s_linear_infinite_reverse]" />

          {/* Central Logo */}
          <div className="relative z-10 p-1">
            <CompanyLogo size="xl" withText={false} glow={true} />
          </div>
        </div>

        {/* Brand & Mission Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] uppercase tracking-wider mb-2">
            <Cpu className="h-3.5 w-3.5 animate-pulse" />
            <span>NeuroFactory AI · Industrial Core</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2 font-display">
            NeuroFactory <span className="text-cyan-400 font-mono text-xl">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {language === 'kz'
              ? 'Қазақстанның ауыр өнеркәсібіне арналған кешенді ЖИ платформасы'
              : 'Индустриальная платформа предиктивного интеллекта и промбезопасности'}
          </p>
        </div>

        {/* 3 Pillar Modules Preview Badges */}
        <div className="grid grid-cols-3 gap-2 w-full mb-6 text-xs">
          <div className={`p-2.5 rounded-lg border text-center transition-all ${
            stepIndex >= 0 ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-cyan-400" />
            <div className="font-semibold text-[11px]">SafeVision</div>
            <div className="text-[9px] text-slate-400">YOLOv11 СИЗ</div>
          </div>

          <div className={`p-2.5 rounded-lg border text-center transition-all ${
            stepIndex >= 1 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <Leaf className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
            <div className="font-semibold text-[11px]">EcoPredict</div>
            <div className="text-[9px] text-slate-400">LSTM ПДК</div>
          </div>

          <div className={`p-2.5 rounded-lg border text-center transition-all ${
            stepIndex >= 2 ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <Activity className="h-4 w-4 mx-auto mb-1 text-amber-400" />
            <div className="font-semibold text-[11px]">FailPredict</div>
            <div className="text-[9px] text-slate-400">ISO 10816</div>
          </div>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-full space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              {currentStep.title}
            </span>
            <span className="font-mono text-slate-200 font-bold">{progress}%</span>
          </div>

          {/* Progress Track */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-teal-400 to-cyan-300 transition-all duration-100 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 font-mono truncate">
            {currentStep.desc}
          </p>
        </div>

        {/* Skip / Enter Action */}
        <div className="flex items-center justify-between w-full pt-4 border-t border-slate-800 text-xs">
          <span className="text-[11px] text-slate-500 font-mono">
            {language === 'kz' ? 'Нұсқа 2.4.0 · ҚР Стандарттары' : 'Версия 2.4.0 · Стандарты РК'}
          </span>

          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-cyan-500 text-xs transition-colors group"
          >
            <span>{language === 'kz' ? 'Өткізіп жіберу' : 'Войти в терминал'}</span>
            <ArrowRight className="h-3.5 w-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

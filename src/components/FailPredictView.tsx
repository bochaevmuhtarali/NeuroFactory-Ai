import React, { useState } from 'react';
import {
  IndustrialMachine,
  MachineRiskLevel,
  Language,
} from '../types';
import { translations } from '../i18n/translations';
import { filterMachines } from '../utils/industrialMath';
import {
  Activity,
  AlertOctagon,
  Wrench,
  Thermometer,
  Gauge,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  Sliders,
} from 'lucide-react';

interface FailPredictViewProps {
  machines: IndustrialMachine[];
  onDispatchWorkOrder: (machineId: string) => void;
  onSimulateAnomaly: () => void;
  language: Language;
  onAddMachine?: (machine: any) => void;
  onLoadDemoData?: () => void;
}

export const FailPredictView: React.FC<FailPredictViewProps> = ({
  machines,
  onDispatchWorkOrder,
  onSimulateAnomaly,
  language,
  onAddMachine,
  onLoadDemoData,
}) => {
  const t = translations[language];

  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || 'mach-01');
  const [samplingRateKhz, setSamplingRateKhz] = useState<number>(25.6);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];
  const filteredMachines = filterMachines(machines, areaFilter, riskFilter);
  const uniqueAreas = Array.from(new Set(machines.map((m) => m.area)));

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  // Telemetry SVG Chart Geometry
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 25;

  const history = selectedMachine?.telemetryHistory || [];
  const maxVib = Math.max(10, ...history.map((h) => h.vibration));

  const vibPoints = history.map((h, i) => {
    const denom = history.length > 1 ? history.length - 1 : 1;
    const x = paddingX + (i / denom) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (h.vibration / maxVib) * (chartHeight - paddingY * 2);
    return { x, y, val: h.vibration, time: h.time };
  });

  const vibPathD = vibPoints.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="space-y-6">
      {/* Module Overview Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              <Activity className="h-4 w-4" />
              <span>Predictive Vibration Analysis · ISO 10816-3 & RUL Engine</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {t.failpredict.title}
            </h1>
            <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
              {t.failpredict.taskDescription}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onSimulateAnomaly}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/60 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-900/60 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-rose-400" />
              <span>{t.failpredict.simulateVibrationAnomaly}</span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              title={t.common.refreshData}
            >
              <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.common.refreshData}</span>
            </button>
          </div>
        </div>

        {/* 4 Status KPI Strip */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">
              {t.failpredict.fleetHealth}
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {machines.length > 0 ? '86.2%' : '0%'}
            </div>
            <div className="text-[10px] text-slate-400">
              {machines.length > 0 ? 'По стандарту ISO 10816' : t.emptyStates.machinesNotConnected}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">
              {t.failpredict.unitsMonitored}
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {machines.length} агрегатов
            </div>
            <div className={`text-[10px] flex items-center gap-1 font-mono ${machines.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${machines.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span>{machines.length > 0 ? '100% датчиков активны' : t.emptyStates.machinesNotConnected}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">
              {t.failpredict.criticalUnits}
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
              {machines.filter((m) => m.riskStatus === 'critical' || m.riskStatus === 'high').length}
            </div>
            <div className="text-[10px] text-slate-400">
              {machines.length > 0 ? 'Требуют планового/срочного ТО' : '0 узлов с риском'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">
              {t.failpredict.avgRul}
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {machines.length > 0 ? '~760 ч' : '—'}
            </div>
            <div className="text-[10px] text-slate-400">
              {machines.length > 0 ? 'До расчетной замены подшипников' : 'Ожидание телеметрии'}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Spotlight & Telemetry or Disconnected Empty State Banner */}
      {machines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/60 p-10 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-slate-400">
            <Activity className="h-7 w-7 text-amber-500/70" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-bold text-white">
              {t.emptyStates.machinesNotConnected}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.emptyStates.machinesNotConnectedDesc}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onAddMachine && (
              <button
                type="button"
                onClick={() =>
                  onAddMachine({
                    id: 'mach-' + Date.now().toString(36),
                    name: 'Турбокомпрессор К-250 (Блок №1)',
                    type: 'Турбокомпрессор высокого давления',
                    area: 'Цех №1 (Конвертерный)',
                    installedYear: 2022,
                    temperatureC: 54.0,
                    temperatureBaselineC: 52.0,
                    vibrationRmsMmS: 2.2,
                    vibrationBaselineMmS: 1.9,
                    peakFrequencyHz: 28.0,
                    riskStatus: 'low',
                    failureProbabilityPercent: 14,
                    remainingUsefulLifeHours: 3800,
                    recommendations: {
                      ru: 'Показатели вибрации и температуры в пределах зоны А (ISO 10816-3)',
                      kz: 'Діріл мен температура көрсеткіштері А аймағы шегінде (ISO 10816-3)',
                    },
                    lastInspectionDate: new Date().toISOString().split('T')[0],
                    telemetryHistory: [
                      { time: '10:00', temp: 53.0, vibration: 2.1 },
                      { time: '11:00', temp: 54.0, vibration: 2.2 },
                    ],
                  })
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors shadow-sm"
              >
                <Wrench className="h-4 w-4" />
                <span>{t.emptyStates.connectMachineBtn}</span>
              </button>
            )}
            {onLoadDemoData && (
              <button
                type="button"
                onClick={onLoadDemoData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>{t.emptyStates.loadDemoStand}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Telemetry & Recommendation Card */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="font-bold text-xs text-white">
                {selectedMachine?.name}
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedMachine.area}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedMachine.riskStatus === 'critical' && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-950 border border-rose-800 text-rose-300">
                  КРИТИЧЕСКИЙ РИСК ({selectedMachine.failureProbabilityPercent}%)
                </span>
              )}
              {selectedMachine.riskStatus === 'high' && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-950/80 border border-rose-800 text-rose-300">
                  ВЫСОКИЙ РИСК ({selectedMachine.failureProbabilityPercent}%)
                </span>
              )}
              {selectedMachine.riskStatus === 'medium' && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-amber-950 border border-amber-800 text-amber-300">
                  ВНИМАНИЕ ({selectedMachine.failureProbabilityPercent}%)
                </span>
              )}
              {selectedMachine.riskStatus === 'low' && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-emerald-950 border border-emerald-800 text-emerald-300">
                  ШТАТНЫЙ РЕЖИМ ({selectedMachine.failureProbabilityPercent}%)
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Telemetry Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{t.failpredict.vibration}</span>
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                  {selectedMachine.vibrationRmsMmS}{' '}
                  <span className="text-xs font-normal text-slate-400">мм/с RMS</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  База: {selectedMachine.vibrationBaselineMmS} мм/с
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                  <span>{t.failpredict.temperature}</span>
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                  {selectedMachine.temperatureC}{' '}
                  <span className="text-xs font-normal text-slate-400">°C</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  База: {selectedMachine.temperatureBaselineC} °C
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t.failpredict.rulHours}</span>
                </div>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1 tabular-nums">
                  {selectedMachine.remainingUsefulLifeHours}{' '}
                  <span className="text-xs font-normal text-slate-400">часов</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  До отказа подшипника
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                  <span>{t.failpredict.failureProb}</span>
                </div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
                  {selectedMachine.failureProbabilityPercent}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Оценка нейросети
                </div>
              </div>
            </div>

            {/* Vibration Trend Chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  {t.failpredict.telemetryTitle} (Вибрация RMS, мм/с)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Пиковая частота: {selectedMachine.peakFrequencyHz} Гц
                </span>
              </div>

              <div className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[400px]">
                  {/* Grid Lines */}
                  <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#334155" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#1e293b" />
                  <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#334155" />

                  {/* ISO 10816 Zone C & D Lines */}
                  <line x1={paddingX} y1={chartHeight - paddingY - (4.5 / maxVib) * (chartHeight - paddingY * 2)} x2={chartWidth - paddingX} y2={chartHeight - paddingY - (4.5 / maxVib) * (chartHeight - paddingY * 2)} stroke="#f59e0b" strokeDasharray="3 3" />
                  <line x1={paddingX} y1={chartHeight - paddingY - (7.1 / maxVib) * (chartHeight - paddingY * 2)} x2={chartWidth - paddingX} y2={chartHeight - paddingY - (7.1 / maxVib) * (chartHeight - paddingY * 2)} stroke="#ef4444" strokeDasharray="4 4" />

                  {/* Vibration curve */}
                  <path d={vibPathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Points */}
                  {vibPoints.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="4" fill="#06b6d4" stroke="#020617" strokeWidth="2" />
                      <text x={p.x} y={p.y - 7} fill="#e2e8f0" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        {p.val}
                      </text>
                      <text x={p.x} y={chartHeight - 6} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        {p.time}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Engineer Recommendations & Work Order Dispatch */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                <Wrench className="h-4 w-4" />
                <span>{t.failpredict.engineerRecommendation}</span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                {language === 'kz' ? selectedMachine.recommendations.kz : selectedMachine.recommendations.ru}
              </p>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono">
                  Дата крайнего осмотра: {selectedMachine.lastInspectionDate}
                </div>

                {selectedMachine.hasActiveWorkOrder ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-xs text-emerald-300 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{t.failpredict.workOrderCreated}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onDispatchWorkOrder(selectedMachine.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors shadow-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t.failpredict.requestWorkOrder}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sensor calibration settings (Data Input) */}
          <div className="border-t border-slate-800 bg-slate-950/60 p-4">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>{t.failpredict.inputDataTitle}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.failpredict.samplingRate}</span>
              <span className="font-mono text-cyan-400 font-semibold">{samplingRateKhz} кГц</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="2"
              value={samplingRateKhz}
              onChange={(e) => setSamplingRateKhz(Number(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Equipment Roster Sidebar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm flex flex-col">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>{t.failpredict.equipmentListTitle}</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {machines.length} ед.
            </span>
          </div>

          {/* Equipment list items */}
          <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
            {machines.map((mach) => {
              const isSelected = mach.id === selectedMachineId;

              return (
                <button
                  key={mach.id}
                  onClick={() => setSelectedMachineId(mach.id)}
                  className={`w-full text-left rounded-lg p-3 border transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-slate-800/90 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-semibold text-xs text-white truncate max-w-[190px]">
                      {mach.name}
                    </div>

                    {mach.riskStatus === 'critical' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-950 border border-rose-800 text-rose-300 font-bold">
                        {mach.failureProbabilityPercent}% РИСК
                      </span>
                    )}
                    {mach.riskStatus === 'high' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 border border-rose-800 text-rose-300">
                        {mach.failureProbabilityPercent}%
                      </span>
                    )}
                    {mach.riskStatus === 'medium' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 border border-amber-800 text-amber-300">
                        {mach.failureProbabilityPercent}%
                      </span>
                    )}
                    {mach.riskStatus === 'low' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300">
                        ОК
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 mb-2">
                    {mach.area} · Год ввода: {mach.installedYear}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/80 p-1.5 rounded">
                    <div>
                      <span className="text-slate-400">Вибрация:</span>{' '}
                      <span className="font-bold text-white">{mach.vibrationRmsMmS} мм/с</span>
                    </div>
                    <div>
                      <span className="text-slate-400">RUL:</span>{' '}
                      <span className="font-bold text-cyan-300">{mach.remainingUsefulLifeHours} ч</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Equipment Table with Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Сводный реестр агрегатов и статус деградации</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Комплексная оценка виброускорения и теплового профиля подшипников по ГОСТ / ISO 10816.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Area Filter */}
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">{t.common.allAreas}</option>
              {uniqueAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Все уровни риска</option>
              <option value="low">Низкий (Штатный)</option>
              <option value="medium">Внимание</option>
              <option value="high">Высокий риск</option>
              <option value="critical">Критический</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredMachines.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-300">{t.common.noData}</div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Оборудования по заданным параметрам фильтрации не найдено.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Агрегат</th>
                  <th className="py-2.5 px-3">Цех / Участок</th>
                  <th className="py-2.5 px-3 text-right">Вибрация (RMS)</th>
                  <th className="py-2.5 px-3 text-right">Температура</th>
                  <th className="py-2.5 px-3 text-right">RUL (Остаток)</th>
                  <th className="py-2.5 px-3">Статус риска</th>
                  <th className="py-2.5 px-3 text-right">Наряд-допуск</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMachines.map((m) => {
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMachineId(m.id)}
                      className={`cursor-pointer transition-colors ${
                        m.id === selectedMachineId ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.type}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {m.area}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-white tabular-nums">
                        {m.vibrationRmsMmS} мм/с
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                        {m.temperatureC} °C
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-cyan-300 font-medium tabular-nums">
                        {m.remainingUsefulLifeHours} ч
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {m.riskStatus === 'critical' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                            {t.failpredict.riskCritical}
                          </span>
                        )}
                        {m.riskStatus === 'high' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                            {t.failpredict.riskHigh}
                          </span>
                        )}
                        {m.riskStatus === 'medium' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                            {t.failpredict.riskMedium}
                          </span>
                        )}
                        {m.riskStatus === 'low' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {t.failpredict.riskLow}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {m.hasActiveWorkOrder ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800">
                            Наряд выдан
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDispatchWorkOrder(m.id);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 hover:bg-slate-700 transition-colors"
                          >
                            Выдать наряд
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

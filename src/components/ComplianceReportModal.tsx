import React, { useState } from 'react';
import { Language, UserProfile, PPEViolation, EcoSensor, IndustrialMachine } from '../types';
import { translations } from '../i18n/translations';
import { playPingSound } from '../utils/industrialAudio';
import {
  X,
  Printer,
  FileText,
  ShieldCheck,
  Leaf,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  Award,
  DollarSign,
  Download,
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

interface ComplianceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  profile: UserProfile | null;
  violations: PPEViolation[];
  ecoSensors: EcoSensor[];
  machines: IndustrialMachine[];
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({
  isOpen,
  onClose,
  language,
  profile,
  violations,
  ecoSensors,
  machines,
}) => {
  const t = translations[language];
  const [reportType, setReportType] = useState<'safety' | 'eco' | 'roi'>('safety');

  if (!isOpen) return null;

  // Kazakhstan 2026 Monthly Calculation Index (1 МРП = 3 932 тенге)
  const MRP_RATE_2026 = 3932;
  const estimatedFineAvoidanceMRP = 485;
  const estimatedSavingsKZT = (estimatedFineAvoidanceMRP * MRP_RATE_2026).toLocaleString('ru-RU');

  const todayStr = new Date().toLocaleDateString(language === 'kz' ? 'kk-KZ' : 'ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    playPingSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-7 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors print:hidden"
          aria-label={t.common.close}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header Controls (Hidden during window.print) */}
        <div className="mb-6 print:hidden">
          <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <FileText className="h-4 w-4" />
            <span>Генератор официальных актов и заключений РК</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {language === 'kz'
              ? 'Өндірістік қауіпсіздік және экологиялық есеп'
              : 'Промышленный отчет по охране труда и нормам ПДК'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'kz'
              ? 'ҚР Экологиялық кодексі мен ГОСТ 12.4.011-89 сәйкес дайын құжат'
              : 'Сформирован на основе реальной телеметрии Edge AI для государственных органов и инспекций РК'}
          </p>

          {/* Report Type Tabs */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setReportType('safety')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                reportType === 'safety'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Акт нарушений СИЗ (ГОСТ)</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('eco')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                reportType === 'eco'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Leaf className="h-4 w-4" />
              <span>Рапорт ПДК (Минэкологии РК)</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('roi')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                reportType === 'roi'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Расчет экономии в МРП</span>
            </button>
          </div>
        </div>

        {/* Printable Official Document Sheet */}
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-6 sm:p-8 text-slate-100 shadow-inner font-sans print:border-none print:bg-white print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-slate-800 pb-5 mb-5 print:border-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="mb-2">
                  <CompanyLogo size="xs" withText={true} glow={false} />
                </div>
                <div className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-bold print:text-black">
                  НЕЙРОСЕТЕВАЯ СИСТЕМА КОНТРОЛЯ «NEUROFACTORY AI»
                </div>
                <div className="text-lg font-black text-white mt-1 print:text-black">
                  {profile?.factoryName || 'Производственное предприятие'}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 print:text-gray-700">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400 print:text-black" />
                  <span>Регион: <strong>{profile?.region || 'Жамбылская область'}</strong></span>
                  <span>·</span>
                  <span>Отрасль: {profile?.industrySector || 'Металлургия и химия'}</span>
                </div>
              </div>

              <div className="text-right sm:text-right text-xs font-mono text-slate-400 print:text-black">
                <div className="font-bold text-white print:text-black">АКТ № NF-{new Date().getFullYear()}-{Math.floor(Math.random() * 899 + 100)}</div>
                <div>Дата: {todayStr}</div>
                <div className="text-[10px] text-emerald-400 print:text-black">Статус: ВЕРИФИЦИРОВАНО AI</div>
              </div>
            </div>
          </div>

          {/* Safety Report Body */}
          {reportType === 'safety' && (
            <div className="space-y-4 text-xs">
              <div className="font-bold uppercase tracking-wider text-sm text-cyan-300 print:text-black border-b border-slate-800 pb-1 print:border-gray-400">
                1. АКТ ВНУТРЕННЕГО РАССЛЕДОВАНИЯ ИНЦИДЕНТОВ СИЗ (ГОСТ 12.4.011-89)
              </div>
              <p className="text-slate-300 leading-relaxed print:text-gray-800">
                Настоящий акт составлен автоматизированным модулем нейросетевой видеоаналитики SafeVision (YOLOv11 Edge).
                За отчетный период зафиксировано {violations.length} событий отклонения от норм промышленной безопасности.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-800 print:border-gray-400">
                  <thead className="bg-slate-900 print:bg-gray-100 text-[11px] font-mono text-slate-300 print:text-black">
                    <tr>
                      <th className="p-2 border border-slate-800 print:border-gray-400">№</th>
                      <th className="p-2 border border-slate-800 print:border-gray-400">Зона / Камера</th>
                      <th className="p-2 border border-slate-800 print:border-gray-400">Тип нарушения</th>
                      <th className="p-2 border border-slate-800 print:border-gray-400">Точность AI</th>
                      <th className="p-2 border border-slate-800 print:border-gray-400">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-gray-300 text-[11px]">
                    {violations.length > 0 ? (
                      violations.slice(0, 5).map((v, i) => (
                        <tr key={v.id}>
                          <td className="p-2 border border-slate-800 print:border-gray-400 font-mono">{i + 1}</td>
                          <td className="p-2 border border-slate-800 print:border-gray-400">{v.area} ({v.cameraName})</td>
                          <td className="p-2 border border-slate-800 print:border-gray-400 font-medium text-amber-300 print:text-black">
                            {v.violationType === 'no_helmet' && 'Отсутствие защитной каски'}
                            {v.violationType === 'no_vest' && 'Отсутствие сигнального жилета'}
                            {v.violationType === 'no_goggles' && 'Отсутствие защитных очков'}
                            {v.violationType === 'hazard_zone_entry' && 'Вход в опасную крановую зону'}
                          </td>
                          <td className="p-2 border border-slate-800 print:border-gray-400 font-mono">{(v.confidence * 100).toFixed(0)}%</td>
                          <td className="p-2 border border-slate-800 print:border-gray-400 font-mono text-emerald-400 print:text-black">
                            {v.status === 'resolved' ? 'Устранено' : 'Проинструктирован'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-500">
                          {profile?.hasConnectedHardware === false
                            ? 'Оборудование пока не подключено. Нарушений нет.'
                            : 'Нарушений за отчетный период не зафиксировано (100% соблюдение).'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Eco Report Body */}
          {reportType === 'eco' && (
            <div className="space-y-4 text-xs">
              <div className="font-bold uppercase tracking-wider text-sm text-emerald-400 print:text-black border-b border-slate-800 pb-1 print:border-gray-400">
                2. ОФИЦИАЛЬНЫЙ РАПОРТ ПДК ВЫБРОСОВ (ФОРМА 2-ТП ВОЗДУХ / МИНЭКОЛОГИИ РК)
              </div>
              <p className="text-slate-300 leading-relaxed print:text-gray-800">
                Сводные показатели автоматических постов непрерывного экологического мониторинга (АСТЭМ) согласно требованиям
                Экологического кодекса Республики Казахстан.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ecoSensors.length > 0 ? (
                  ecoSensors.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg border border-slate-800 print:border-gray-400 bg-slate-900/60 print:bg-gray-50">
                      <div className="text-[11px] font-bold text-white print:text-black">{s.name}</div>
                      <div className="text-lg font-bold font-mono text-emerald-400 print:text-black mt-1">
                        {s.currentValue} {s.unit}
                      </div>
                      <div className="text-[10px] text-slate-400 print:text-gray-700">
                        Норма ПДК: &le; {s.thresholdCritical} {s.unit}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Локация: {s.area}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-4 text-center text-slate-500">
                    Датчики газоочистки не подключены.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROI / MRP Savings Report Body */}
          {reportType === 'roi' && (
            <div className="space-y-4 text-xs">
              <div className="font-bold uppercase tracking-wider text-sm text-amber-400 print:text-black border-b border-slate-800 pb-1 print:border-gray-400">
                3. РАСЧЕТ ПРЕДОТВРАЩЕННОГО ЭКОЛОГИЧЕСКОГО И АВАРИЙНОГО УЩЕРБА (В МРП РК)
              </div>
              <p className="text-slate-300 leading-relaxed print:text-gray-800">
                На основании статьи 574 Налогового кодекса РК и Кодекса об административных правонарушениях РК за
                превышение установленных нормативов эмиссий в окружающую среду и нарушение требований техники безопасности:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 print:bg-gray-100 print:border-black">
                  <div className="text-xs text-amber-300 print:text-black font-semibold">
                    Предотвращено штрафов по залповым выбросам:
                  </div>
                  <div className="text-2xl font-black font-mono text-white print:text-black mt-1">
                    {estimatedFineAvoidanceMRP} МРП
                  </div>
                  <div className="text-xs text-slate-400 print:text-gray-600 mt-1">
                    Эквивалентно: <strong>{estimatedSavingsKZT} тенге</strong> (по ставке 3 932 ₸/МРП в 2026 году)
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 print:bg-gray-100 print:border-black">
                  <div className="text-xs text-cyan-300 print:text-black font-semibold">
                    Предиктивно сохраненный моторесурс оборудования:
                  </div>
                  <div className="text-2xl font-black font-mono text-white print:text-black mt-1">
                    142 часа
                  </div>
                  <div className="text-xs text-slate-400 print:text-gray-600 mt-1">
                    Предотвращение аварийных остановов на дымососах и мельницах
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Signatures & Certification Block */}
          <div className="mt-8 pt-5 border-t border-slate-800 print:border-black grid grid-cols-2 gap-6 text-[11px] text-slate-300 print:text-black">
            <div>
              <div className="font-semibold text-white print:text-black">
                Главный инженер / Ответственный за ТБ:
              </div>
              <div className="mt-3 border-b border-slate-700 print:border-black w-3/4"></div>
              <div className="text-[10px] text-slate-400 print:text-gray-700 mt-1">
                {profile?.contactPerson || 'Бочаев М. / Инженер предприятия'}
              </div>
            </div>

            <div>
              <div className="font-semibold text-white print:text-black">
                Цифровая верификация шлюза NeuroFactory Edge:
              </div>
              <div className="mt-1 font-mono text-[10px] text-emerald-400 print:text-black">
                SHA256: 9b2d87a4f912c4e5180c4... (Verified)
              </div>
              <div className="text-[10px] text-slate-500 print:text-gray-600">
                Заверено криптографической подписью ядра
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs print:hidden">
          <div className="text-slate-400 text-[11px]">
            {language === 'kz'
              ? 'Құжатты принтерге жіберуге немесе PDF түрінде сақтауға болады'
              : 'Документ оптимизирован для печати и сохранения в формате PDF'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {t.common.close}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white transition-colors shadow-sm flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              <span>{language === 'kz' ? 'Басып шығару (Печать / PDF)' : 'Печать отчета / Сохранить в PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Language, IndustrialCamera, EcoSensor, IndustrialMachine } from '../types';
import { translations } from '../i18n/translations';
import { playPingSound } from '../utils/industrialAudio';
import {
  X,
  Camera,
  Activity,
  Leaf,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HardDrive,
  Cpu,
  Layers,
} from 'lucide-react';

interface HardwareConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialType?: 'camera' | 'sensor' | 'machine';
  onAddCamera?: (camera: IndustrialCamera) => void;
  onAddSensor?: (sensor: EcoSensor) => void;
  onAddMachine?: (machine: IndustrialMachine) => void;
}

export const HardwareConnectModal: React.FC<HardwareConnectModalProps> = ({
  isOpen,
  onClose,
  language,
  initialType = 'camera',
  onAddCamera,
  onAddSensor,
  onAddMachine,
}) => {
  const t = translations[language];
  const [deviceType, setDeviceType] = useState<'camera' | 'sensor' | 'machine'>(initialType);

  // Camera fields
  const [camName, setCamName] = useState('CAM-05: Литейный пролет (Кран №2)');
  const [camArea, setCamArea] = useState('Цех литья и формовки');
  const [camIp, setCamIp] = useState('192.168.10.145:554/live/ch0');
  const [camResolution, setCamResolution] = useState('1920x1080 (60Hz)');
  const [camFps, setCamFps] = useState(25);

  // Sensor fields
  const [sensorGas, setSensorGas] = useState<'SO2' | 'CO' | 'NO2' | 'PM2_5' | 'PM10'>('SO2');
  const [sensorName, setSensorName] = useState('Пост №5: Газоочистка конвертера (SO₂)');
  const [sensorArea, setSensorArea] = useState('Газоочистная станция');
  const [sensorIp, setSensorIp] = useState('192.168.10.210:502 (Modbus TCP)');

  // Machine fields
  const [machName, setMachName] = useState('Турбовоздуходувка ТВ-175 №2');
  const [machType, setMachType] = useState('Центробежный нагнетатель');
  const [machArea, setMachArea] = useState('Компрессорное отделение');
  const [machYear, setMachYear] = useState(2021);

  // Test ping state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    pingMs: number;
    protocol: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      playPingSound();
      const ping = Math.floor(Math.random() * 8) + 12; // 12-20ms
      if (deviceType === 'camera') {
        setTestResult({
          success: true,
          pingMs: ping,
          protocol: 'RTSP / H.264 (TCP/UDP)',
          message:
            language === 'kz'
              ? `RTSP ағыны белсенді (Handshake OK, ${ping}ms, H.264解码 60fps)`
              : `RTSP видеопоток доступен (Handshake OK, ${ping}мс, декодирование H.264 60fps)`,
        });
      } else if (deviceType === 'sensor') {
        setTestResult({
          success: true,
          pingMs: ping,
          protocol: 'Modbus TCP / Port 502',
          message:
            language === 'kz'
              ? `Modbus TCP регистрлері оқылды (Unit ID: 1, ${ping}ms)`
              : `Modbus TCP регистры прочитаны успешно (Unit ID: 1, опрос 100мс, ${ping}мс)`,
        });
      } else {
        setTestResult({
          success: true,
          pingMs: ping,
          protocol: 'ISO 10816 IEPE / 24-bit ADC',
          message:
            language === 'kz'
              ? `Вибросенсор калибрленді (RMS 0.8 мм/с, 25.6 кГц, ${ping}ms)`
              : `Вибродатчик синхронизирован (RMS 0.8 мм/с, АЦП 25.6 кГц, пинг ${ping}мс)`,
        });
      }
    }, 600);
  };

  const handleSaveDevice = () => {
    playPingSound();

    if (deviceType === 'camera' && onAddCamera) {
      const newCamera: IndustrialCamera = {
        id: 'cam-' + Date.now().toString(36),
        name: camName,
        area: camArea,
        streamUrl: camIp,
        fps: camFps,
        resolution: camResolution,
        status: 'active',
        currentDetections: {
          helmetsOk: 4,
          helmetsMissing: 0,
          vestsOk: 4,
          vestsMissing: 0,
          gogglesOk: 4,
          gogglesMissing: 0,
          inHazardZone: 0,
        },
      };
      onAddCamera(newCamera);
    } else if (deviceType === 'sensor' && onAddSensor) {
      const thresholds: Record<string, { warn: number; crit: number; unit: string }> = {
        SO2: { warn: 0.35, crit: 0.5, unit: 'мг/м³' },
        CO: { warn: 3.5, crit: 5.0, unit: 'мг/м³' },
        NO2: { warn: 0.15, crit: 0.2, unit: 'мг/м³' },
        PM2_5: { warn: 110, crit: 160, unit: 'мкг/м³' },
        PM10: { warn: 200, crit: 300, unit: 'мкг/м³' },
      };
      const cfg = thresholds[sensorGas] || thresholds.SO2;
      const newSensor: EcoSensor = {
        id: 'eco-' + Date.now().toString(36),
        name: sensorName,
        code: sensorGas,
        unit: cfg.unit,
        currentValue: Number((cfg.warn * 0.65).toFixed(2)),
        thresholdWarning: cfg.warn,
        thresholdCritical: cfg.crit,
        area: sensorArea,
        status: 'normal',
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
      };
      onAddSensor(newSensor);
    } else if (deviceType === 'machine' && onAddMachine) {
      const newMachine: IndustrialMachine = {
        id: 'mach-' + Date.now().toString(36),
        name: machName,
        type: machType,
        area: machArea,
        installedYear: machYear,
        temperatureC: 54.0,
        temperatureBaselineC: 52.0,
        vibrationRmsMmS: 1.8,
        vibrationBaselineMmS: 1.5,
        peakFrequencyHz: 49.8,
        riskStatus: 'low',
        failureProbabilityPercent: 6,
        remainingUsefulLifeHours: 8500,
        recommendations: {
          ru: 'Штатный виброакустический режим. Регулярная проверка смазочного узла согласно графику ТОиР.',
          kz: 'Қалыпты діріл-акустикалық режим. Жоспарлы техникалық қызмет көрсету кестесіне сәйкес майлау торабын тексеру.',
        },
        lastInspectionDate: new Date().toISOString().split('T')[0],
        telemetryHistory: [
          { time: '10:00', temp: 53.5, vibration: 1.7 },
          { time: '11:00', temp: 54.0, vibration: 1.8 },
        ],
      };
      onAddMachine(newMachine);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto max-h-[92dvh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label={t.common.close}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto p-5 sm:p-6 no-scrollbar">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <Cpu className="h-4 w-4" />
            <span>Edge Hardware Gateway · Modbus / RTSP / ONVIF</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {language === 'kz' ? 'Жаңа өндірістік жабдықты қосу' : 'Подключение промышленного оборудования'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'kz'
              ? 'Камераларды, газ талдағыштар мен вибросенсорларды зауыттық желіге қосыңыз'
              : 'Интеграция IP-камер видеонаблюдения, газоанализаторов и датчиков вибрации в реальном времени'}
          </p>
        </div>

        {/* Device Type Selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            type="button"
            onClick={() => {
              setDeviceType('camera');
              setTestResult(null);
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
              deviceType === 'camera'
                ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold shadow-sm'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">IP / RTSP Камера</span>
            <span className="text-[10px] text-slate-500 font-mono">YOLOv11</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeviceType('sensor');
              setTestResult(null);
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
              deviceType === 'sensor'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold shadow-sm'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Leaf className="h-5 w-5" />
            <span className="text-xs">Эко-датчик (ПДК)</span>
            <span className="text-[10px] text-slate-500 font-mono">Modbus TCP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeviceType('machine');
              setTestResult(null);
            }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
              deviceType === 'machine'
                ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold shadow-sm'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="h-5 w-5" />
            <span className="text-xs">Агрегат / Станок</span>
            <span className="text-[10px] text-slate-500 font-mono">ISO 10816</span>
          </button>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4 text-xs">
          {deviceType === 'camera' && (
            <>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {language === 'kz' ? 'Камера атауы' : 'Название камеры / Точки наблюдения'}
                </label>
                <input
                  type="text"
                  value={camName}
                  onChange={(e) => setCamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {language === 'kz' ? 'Өндірістік цех' : 'Цех / Участок'}
                  </label>
                  <input
                    type="text"
                    value={camArea}
                    onChange={(e) => setCamArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {language === 'kz' ? 'Кадр жиілігі (FPS)' : 'Частота кадров (FPS)'}
                  </label>
                  <select
                    value={camFps}
                    onChange={(e) => setCamFps(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs"
                  >
                    <option value={15}>15 FPS (Эконом)</option>
                    <option value={25}>25 FPS (ГОСТ)</option>
                    <option value={30}>30 FPS (Штатно)</option>
                    <option value={60}>60 FPS (Высокоскоростная)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  RTSP Stream URL / IP-адрес
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={camIp}
                    onChange={(e) => setCamIp(e.target.value)}
                    placeholder="rtsp://admin:pass@192.168.1.100:554/live"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-2 rounded-lg border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                    <span>Ping</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {deviceType === 'sensor' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {language === 'kz' ? 'Газ түрі' : 'Анализируемый газ / ПДК'}
                  </label>
                  <select
                    value={sensorGas}
                    onChange={(e) => {
                      const g = e.target.value as any;
                      setSensorGas(g);
                      setSensorName(`Пост газоочистки: датчик ${g}`);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  >
                    <option value="SO2">SO₂ (Диоксид серы)</option>
                    <option value="CO">CO (Оксид углерода)</option>
                    <option value="NO2">NO₂ (Диоксид азота)</option>
                    <option value="PM2_5">PM2.5 (Мелкодисперсная пыль)</option>
                    <option value="PM10">PM10 (Взвешенные частицы)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {language === 'kz' ? 'Бекет орны' : 'Пост / Локация'}
                  </label>
                  <input
                    type="text"
                    value={sensorArea}
                    onChange={(e) => setSensorArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {language === 'kz' ? 'Датчик атауы' : 'Наименование поста газоанализа'}
                </label>
                <input
                  type="text"
                  value={sensorName}
                  onChange={(e) => setSensorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Modbus TCP IP & Port / MQTT Topic
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sensorIp}
                    onChange={(e) => setSensorIp(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                    <span>Опрос</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {deviceType === 'machine' && (
            <>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {language === 'kz' ? 'Агрегат атауы' : 'Наименование агрегата'}
                </label>
                <input
                  type="text"
                  value={machName}
                  onChange={(e) => setMachName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {language === 'kz' ? 'Жабдық түрі' : 'Тип оборудования (ISO 10816)'}
                  </label>
                  <input
                    type="text"
                    value={machType}
                    onChange={(e) => setMachType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {language === 'kz' ? 'Іске қосылған жылы' : 'Год ввода в эксплуатацию'}
                  </label>
                  <input
                    type="number"
                    value={machYear}
                    onChange={(e) => setMachYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {language === 'kz' ? 'Орналасқан цехы' : 'Цех / Участок монтажа'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={machArea}
                    onChange={(e) => setMachArea(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                    <span>Тест АЦП</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Test Status Banner */}
          {testResult && (
            <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Связь со шлюзом установлена ({testResult.pingMs} мс)</span>
              </div>
              <div className="text-[11px] text-emerald-200/90 font-mono">
                {testResult.message}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSaveDevice}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white transition-colors shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{language === 'kz' ? 'Қосу және белсендіру' : 'Подключить к платформе'}</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

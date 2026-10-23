import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Cpu,
  HardDrive,
  Activity,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Radio,
  Server,
  RefreshCw,
  Bell,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Send,
  Layers,
  Thermometer,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { Language } from '../types';

interface SystemMetricPoint {
  time: string;
  rawTime: number;
  cpu: number;
  memoryGb: number;
  memoryPercent: number;
  gpu: number;
  networkMb: number;
  activeThreads: number;
}

interface EdgeServiceStatus {
  id: string;
  name: string;
  binary: string;
  pid: number;
  cpu: number;
  memoryMb: number;
  uptime: string;
  status: 'running' | 'restarting' | 'warning';
  role: string;
}

interface SystemPerformanceMonitorProps {
  language: Language;
}

const TOTAL_RAM_GB = 32;

export const SystemPerformanceMonitor: React.FC<SystemPerformanceMonitorProps> = ({
  language,
}) => {
  const isKz = language === 'kz';

  // Live streaming control
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [samplingIntervalMs, setSamplingIntervalMs] = useState<number>(2000);
  const [historyWindowSeconds, setHistoryWindowSeconds] = useState<number>(60);

  // Active series toggles
  const [showCpu, setShowCpu] = useState<boolean>(true);
  const [showMemory, setShowMemory] = useState<boolean>(true);
  const [showGpu, setShowGpu] = useState<boolean>(true);
  const [showNetwork, setShowNetwork] = useState<boolean>(false);

  // Stress spike simulation state
  const [isSpikeActive, setIsSpikeActive] = useState<boolean>(false);
  const [spikeTimer, setSpikeTimer] = useState<number>(0);
  const [lastActionNotice, setLastActionNotice] = useState<string | null>(null);

  // Multi-core CPU state (8 virtual industrial edge cores)
  const [coreLoads, setCoreLoads] = useState<number[]>([42, 38, 55, 31, 46, 39, 44, 36]);
  const [cpuTemp, setCpuTemp] = useState<number>(54);

  // Initial history points generator
  const generateInitialData = (): SystemMetricPoint[] => {
    const points: SystemMetricPoint[] = [];
    const now = Date.now();
    const count = 25;
    for (let i = count; i >= 0; i--) {
      const timestamp = new Date(now - i * 2000);
      const timeStr = timestamp.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const baseCpu = 38 + Math.sin(i * 0.4) * 8 + (Math.random() * 6 - 3);
      const baseRamPercent = 46 + Math.cos(i * 0.3) * 3 + (Math.random() * 2 - 1);
      const ramGb = Number(((baseRamPercent / 100) * TOTAL_RAM_GB).toFixed(2));
      const gpuLoad = Math.min(95, Math.max(15, Math.round(44 + Math.sin(i * 0.5) * 12 + (Math.random() * 8 - 4))));
      const netMb = Number((34 + Math.sin(i * 0.6) * 10 + (Math.random() * 6 - 3)).toFixed(1));

      points.push({
        time: timeStr,
        rawTime: timestamp.getTime(),
        cpu: Math.max(10, Math.min(98, Math.round(baseCpu))),
        memoryGb: ramGb,
        memoryPercent: Math.round(baseRamPercent),
        gpu: gpuLoad,
        networkMb: netMb,
        activeThreads: Math.round(24 + Math.random() * 8),
      });
    }
    return points;
  };

  const [metricsHistory, setMetricsHistory] = useState<SystemMetricPoint[]>(generateInitialData);

  // Edge services list
  const [services, setServices] = useState<EdgeServiceStatus[]>([
    {
      id: 'yolo',
      name: 'YOLOv11 Edge Vision Pipeline',
      binary: '/opt/neurofactory/bin/yolov11-worker',
      pid: 18429,
      cpu: 24.6,
      memoryMb: 3420,
      uptime: '14д 06ч 22м',
      status: 'running',
      role: isKz ? 'СИЗ және қауіпті аймақтар инференсі' : 'Инференс СИЗ и опасных зон (FP16 TensorRT)',
    },
    {
      id: 'lstm',
      name: 'LSTM EcoPredict Gas Core',
      binary: '/opt/neurofactory/bin/ecopredict-lstm',
      pid: 18432,
      cpu: 7.2,
      memoryMb: 1280,
      uptime: '14д 06ч 22м',
      status: 'running',
      role: isKz ? 'Шығарындылар және ПДК болжау моделі' : 'Прогноз ПДК и выбросов SO2/CO/NOx (ГОСТ РК)',
    },
    {
      id: 'vibration',
      name: 'ISO 10816 Vibration FFT Engine',
      binary: '/opt/neurofactory/bin/iso10816-fft',
      pid: 18435,
      cpu: 8.4,
      memoryMb: 940,
      uptime: '14д 06ч 22м',
      status: 'running',
      role: isKz ? 'Вибродиагностика және қалдық ресурс' : 'Анализ спектра вибрации и расчет остаточного ресурса RUL',
    },
    {
      id: 'rtsp',
      name: 'RTSP Video Demuxer & WebRTC Proxy',
      binary: '/opt/neurofactory/bin/rtsp-webrtc-proxy',
      pid: 18438,
      cpu: 11.8,
      memoryMb: 1860,
      uptime: '7д 12ч 10м',
      status: 'running',
      role: isKz ? 'Камералар видеоағыны (H.264/H.265)' : 'Низкозадержечный транскодер H.264/H.265 (28 мс)',
    },
    {
      id: 'modbus',
      name: 'Modbus TCP / MQTT Industrial Gateway',
      binary: '/opt/neurofactory/bin/modbus-gateway',
      pid: 18440,
      cpu: 2.4,
      memoryMb: 410,
      uptime: '31д 04ч 45м',
      status: 'running',
      role: isKz ? 'Датчиктер мен СКВМ телеметриясы' : 'Опрос полевых контроллеров и частотных приводов',
    },
    {
      id: 'security',
      name: 'Zero-Trust ABAC Security Sync',
      binary: '/opt/neurofactory/bin/abac-auth-sync',
      pid: 18444,
      cpu: 1.6,
      memoryMb: 320,
      uptime: '31д 04ч 45м',
      status: 'running',
      role: isKz ? 'Синхрондау және рөлдік қауіпсіздік' : 'Синхронизация правил доступа и криптографический аудит',
    },
  ]);

  // Plant Emergency Broadcast Dispatcher state
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastCategory, setBroadcastCategory] = useState<'safety' | 'eco' | 'maintenance' | 'general'>('safety');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('all');
  const [broadcastSuccess, setBroadcastSuccess] = useState<boolean>(false);

  // Interval ticker for real-time stream
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Calculate new point, applying spike multiplier if stress simulation is active
      const spikeFactor = isSpikeActive ? 1.75 : 1.0;
      const baseCpu = (38 + (Math.random() * 12 - 6)) * spikeFactor;
      const targetCpu = Math.max(12, Math.min(98, Math.round(baseCpu)));

      const baseRamPercent = Math.min(
        94,
        (46 + (Math.random() * 4 - 2)) * (isSpikeActive ? 1.35 : 1.0)
      );
      const ramGb = Number(((baseRamPercent / 100) * TOTAL_RAM_GB).toFixed(2));

      const baseGpu = Math.min(98, Math.round((42 + (Math.random() * 14 - 7)) * spikeFactor));
      const baseNet = Number(((35 + (Math.random() * 10 - 5)) * spikeFactor).toFixed(1));

      const newPoint: SystemMetricPoint = {
        time: timeStr,
        rawTime: now.getTime(),
        cpu: targetCpu,
        memoryGb: ramGb,
        memoryPercent: Math.round(baseRamPercent),
        gpu: baseGpu,
        networkMb: baseNet,
        activeThreads: Math.round(24 + (isSpikeActive ? 32 : 0) + Math.random() * 6),
      };

      setMetricsHistory((prev) => {
        const maxPoints = Math.max(15, Math.round(historyWindowSeconds / (samplingIntervalMs / 1000)));
        const sliced = prev.slice(-(maxPoints - 1));
        return [...sliced, newPoint];
      });

      // Update multi-core breakdown
      setCoreLoads((prev) =>
        prev.map(() => {
          const coreVal = Math.round(targetCpu + (Math.random() * 16 - 8));
          return Math.max(8, Math.min(100, coreVal));
        })
      );

      // Temperature fluctuation
      setCpuTemp(isSpikeActive ? 68 + Math.round(Math.random() * 4) : 52 + Math.round(Math.random() * 4));
    }, samplingIntervalMs);

    return () => clearInterval(interval);
  }, [isStreaming, samplingIntervalMs, historyWindowSeconds, isSpikeActive]);

  // Spike countdown timer
  useEffect(() => {
    if (!isSpikeActive) return;
    const timer = setInterval(() => {
      setSpikeTimer((prev) => {
        if (prev <= 1) {
          setIsSpikeActive(false);
          setLastActionNotice(
            isKz
              ? 'Жүктеме тұрақтандырылды: жүйе авто-балансировка арқылы қалыпты режимге оралды'
              : 'Пиковая нагрузка успешно нейтрализована алгоритмом автобалансировки'
          );
          setTimeout(() => setLastActionNotice(null), 5000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSpikeActive, isKz]);

  // Current latest readings
  const currentMetric = useMemo(() => {
    if (metricsHistory.length === 0) {
      return {
        cpu: 38,
        memoryGb: 14.7,
        memoryPercent: 46,
        gpu: 42,
        networkMb: 35.2,
        activeThreads: 26,
      };
    }
    return metricsHistory[metricsHistory.length - 1];
  }, [metricsHistory]);

  // Handler: Trigger workload stress spike
  const handleTriggerStressSpike = () => {
    setIsSpikeActive(true);
    setSpikeTimer(10);
    setLastActionNotice(
      isKz
        ? 'Стресс-тест қосылды: 16 қосымша RTSP потоктары мен нейрожелі инференсі симуляциялануда'
        : 'Запущен стресс-тест: симуляция пикового наплыва 16 RTSP-потоков и нейросетевого инференса'
    );
  };

  // Handler: Garbage collection / RAM buffer flush
  const handleFlushMemoryCache = () => {
    setMetricsHistory((prev) =>
      prev.map((pt, idx) => {
        if (idx >= prev.length - 3) {
          const reducedPercent = Math.max(28, pt.memoryPercent - 14);
          return {
            ...pt,
            memoryPercent: reducedPercent,
            memoryGb: Number(((reducedPercent / 100) * TOTAL_RAM_GB).toFixed(2)),
          };
        }
        return pt;
      })
    );
    setLastActionNotice(
      isKz
        ? 'V8/JVM кэш буфері сәтті тазартылды: 3.8 ГБ жедел жад босатылды'
        : 'Буфер кэша V8/JVM успешно сброшен: освобождено 3.8 ГБ оперативной памяти'
    );
    setTimeout(() => setLastActionNotice(null), 4000);
  };

  // Handler: Restart a specific edge service
  const handleRestartService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, status: 'restarting' } : s))
    );
    setLastActionNotice(
      isKz
        ? `Сервис қайта іске қосылуда: ${serviceId}.service`
        : `Инициализирован перезапуск демона ${serviceId}.service (SIGTERM -> SIGCONT)`
    );

    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                status: 'running',
                pid: Math.floor(18000 + Math.random() * 2000),
                uptime: '0ч 00м 05с',
              }
            : s
        )
      );
      setLastActionNotice(
        isKz
          ? `Сервис сәтті қайта қосылды: ${serviceId}.service (ONLINE)`
          : `Сервис успешно перезапущен: ${serviceId}.service (PID обновлен, статус ONLINE)`
      );
      setTimeout(() => setLastActionNotice(null), 4000);
    }, 1800);
  };

  // Handler: Export performance telemetry as CSV
  const handleExportPerformanceData = () => {
    const headers = 'Timestamp,CPU_Percent,RAM_GB,RAM_Percent,GPU_Percent,Network_MBps,Active_Threads\n';
    const rows = metricsHistory
      .map(
        (p) =>
          `${p.time},${p.cpu},${p.memoryGb},${p.memoryPercent},${p.gpu},${p.networkMb},${p.activeThreads}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurofactory_performance_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handler: Dispatch Plant Emergency Announcement
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    const payload = {
      id: 'alert-' + Date.now(),
      message: broadcastMessage.trim(),
      category: broadcastCategory,
      target: broadcastTarget,
      timestamp: new Date().toISOString(),
      sender: 'Бочаев Мухтарали (Главный администратор)',
    };

    try {
      localStorage.setItem('neurofactory_active_broadcast', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('neurofactory-broadcast', { detail: payload }));
      setBroadcastSuccess(true);
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } catch (err) {
      console.warn('Broadcast save error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notice on Action */}
      {lastActionNotice && (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/40 p-3.5 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 animate-spin" />
            <span className="font-mono">{lastActionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLastActionNotice(null)}
            className="text-cyan-400 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Real-Time Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* CPU Overall */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>{isKz ? 'Процессор (CPU)' : 'Процессор (CPU)'}</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
              <Thermometer className="h-3 w-3" />
              {cpuTemp}°C
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentMetric.cpu}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              AMD EPYC 16vCPU
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                currentMetric.cpu > 80
                  ? 'bg-rose-500'
                  : currentMetric.cpu > 60
                  ? 'bg-amber-400'
                  : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
              }`}
              style={{ width: `${currentMetric.cpu}%` }}
            />
          </div>
        </div>

        {/* Memory RAM */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="h-4 w-4 text-emerald-400" />
              <span>{isKz ? 'Жады (RAM ECC)' : 'Память (RAM ECC)'}</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              {currentMetric.memoryGb} / {TOTAL_RAM_GB} GB
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentMetric.memoryPercent}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              DDR5 5600MHz
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                currentMetric.memoryPercent > 85
                  ? 'bg-rose-500'
                  : currentMetric.memoryPercent > 70
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
              }`}
              style={{ width: `${currentMetric.memoryPercent}%` }}
            />
          </div>
        </div>

        {/* GPU Accelerator */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="h-4 w-4 text-purple-400" />
              <span>{isKz ? 'Нейрогенератор GPU' : 'GPU Инференс'}</span>
            </span>
            <span className="text-[10px] font-mono text-purple-400">
              NVIDIA A10G
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentMetric.gpu}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              TensorRT FP16
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
              style={{ width: `${currentMetric.gpu}%` }}
            />
          </div>
        </div>

        {/* Network & Ingestion */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="h-4 w-4 text-blue-400" />
              <span>{isKz ? 'Ағын қабылдау' : 'Трафик RTSP/IoT'}</span>
            </span>
            <span className="text-[10px] font-mono text-blue-400">
              0 drop
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentMetric.networkMb} <span className="text-xs font-normal">МБ/с</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {currentMetric.activeThreads} ағын
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              style={{ width: `${Math.min(100, (currentMetric.networkMb / 60) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Real-Time Performance Chart from Recharts */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-850">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isKz
                  ? 'Нақты уақыттағы өнімділік мониторы (Recharts Real-Time)'
                  : 'Монитор производительности ядра в реальном времени (Recharts Real-Time)'}
              </h3>
              {isStreaming ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  LIVE STREAM
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
                  <Pause className="h-2.5 w-2.5" />
                  PAUSED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isKz
                ? 'Платформаның CPU, жедел жад (RAM), GPU инференс және трафик ағынын үздіксіз визуализациялау'
                : 'Непрерывная визуализация загрузки процессора, оперативной памяти (RAM) и видеопотоков'}
            </p>
          </div>

          {/* Action and Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isStreaming
                  ? 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                  : 'border-emerald-600 bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
              }`}
              title={isStreaming ? 'Приостановить график' : 'Возобновить график'}
            >
              {isStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isStreaming ? (isKz ? 'Кідірту' : 'Пауза') : (isKz ? 'Қосу' : 'Старт')}</span>
            </button>

            {/* Sampling Rate */}
            <select
              value={samplingIntervalMs}
              onChange={(e) => setSamplingIntervalMs(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-hidden hover:border-slate-600"
              title="Частота опроса телеметрии"
            >
              <option value={1000}>1 сек / такт</option>
              <option value={2000}>2 сек / такт</option>
              <option value={5000}>5 сек / такт</option>
            </select>

            {/* Time Window */}
            <select
              value={historyWindowSeconds}
              onChange={(e) => setHistoryWindowSeconds(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-hidden hover:border-slate-600"
              title="Временное окно"
            >
              <option value={30}>30 сек</option>
              <option value={60}>1 мин</option>
              <option value={120}>2 мин</option>
              <option value={300}>5 мин</option>
            </select>

            {/* Stress Test Button */}
            <button
              type="button"
              onClick={handleTriggerStressSpike}
              disabled={isSpikeActive}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isSpikeActive
                  ? 'border-rose-500 bg-rose-950/60 text-rose-300 animate-pulse'
                  : 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:border-amber-400'
              }`}
              title="Имитация пикового потока видеокамер и нагрузки"
            >
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {isSpikeActive
                  ? `${isKz ? 'Стресс' : 'Пик'}: ${spikeTimer}с`
                  : isKz
                  ? 'Стресс-тест'
                  : 'Стресс-пик'}
              </span>
            </button>

            {/* Memory Flush GC Button */}
            <button
              type="button"
              onClick={handleFlushMemoryCache}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-emerald-300 hover:border-emerald-500/50 transition-colors"
              title="Принудительный сброс буфера оперативной памяти"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{isKz ? 'Жадты тазарту' : 'RAM Flush'}</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportPerformanceData}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Экспорт телеметрии в CSV"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Series Filter Checkboxes */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCpu}
              onChange={(e) => setShowCpu(e.target.checked)}
              className="rounded-sm border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <span className="flex items-center gap-1.5 font-mono text-cyan-300">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
              CPU Load (%)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showMemory}
              onChange={(e) => setShowMemory(e.target.checked)}
              className="rounded-sm border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
            />
            <span className="flex items-center gap-1.5 font-mono text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              RAM Usage (%)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGpu}
              onChange={(e) => setShowGpu(e.target.checked)}
              className="rounded-sm border-slate-700 bg-slate-900 text-purple-500 focus:ring-0"
            />
            <span className="flex items-center gap-1.5 font-mono text-purple-300">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400 inline-block shadow-[0_0_6px_rgba(168,85,247,0.9)]" />
              GPU TensorRT (%)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showNetwork}
              onChange={(e) => setShowNetwork(e.target.checked)}
              className="rounded-sm border-slate-700 bg-slate-900 text-blue-500 focus:ring-0"
            />
            <span className="flex items-center gap-1.5 font-mono text-blue-300">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400 inline-block shadow-[0_0_6px_rgba(59,130,246,0.9)]" />
              Network I/O (МБ/с)
            </span>
          </label>
        </div>

        {/* Recharts Chart Component */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metricsHistory}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as SystemMetricPoint;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1.5 min-w-[190px]">
                        <div className="text-slate-400 pb-1 border-b border-slate-800 flex justify-between">
                          <span>УРОВЕНЬ ЯДРА:</span>
                          <span className="text-white font-bold">{data.time}</span>
                        </div>
                        <div className="flex justify-between items-center text-cyan-400">
                          <span>CPU Load:</span>
                          <span className="font-bold">{data.cpu}%</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400">
                          <span>RAM (GB):</span>
                          <span className="font-bold">{data.memoryGb} GB ({data.memoryPercent}%)</span>
                        </div>
                        <div className="flex justify-between items-center text-purple-400">
                          <span>GPU Inferences:</span>
                          <span className="font-bold">{data.gpu}%</span>
                        </div>
                        <div className="flex justify-between items-center text-blue-400">
                          <span>Ingestion:</span>
                          <span className="font-bold">{data.networkMb} МБ/с</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-850 text-[10px]">
                          <span>Active Pipelines:</span>
                          <span>{data.activeThreads} threads</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
              />

              {showCpu && (
                <Line
                  type="monotone"
                  name={isKz ? 'CPU жүктемесі (%)' : 'Загрузка CPU (%)'}
                  dataKey="cpu"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {showMemory && (
                <Line
                  type="monotone"
                  name={isKz ? 'Жедел жад (%)' : 'Память RAM (%)'}
                  dataKey="memoryPercent"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {showGpu && (
                <Line
                  type="monotone"
                  name={isKz ? 'GPU TensorRT (%)' : 'GPU Ускоритель (%)'}
                  dataKey="gpu"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {showNetwork && (
                <Line
                  type="monotone"
                  name={isKz ? 'Трафик (МБ/с)' : 'Сетевой поток (МБ/с)'}
                  dataKey="networkMb"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-Core CPU Visualizer Bar */}
        <div className="pt-3 border-t border-slate-850">
          <div className="text-[11px] font-mono text-slate-400 mb-2 flex justify-between items-center">
            <span>{isKz ? 'Виртуалды ядролардың жүктемесі (Core 0 - 7):' : 'Нагрузка по процессорным ядрам (Core 0 - 7):'}</span>
            <span className="text-cyan-400 font-bold">AMD EPYC™ 7763 3.4GHz</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {coreLoads.map((load, index) => (
              <div key={index} className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center space-y-1">
                <div className="text-[10px] text-slate-400 font-mono">C{index}</div>
                <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full ${
                      load > 80 ? 'bg-rose-500' : load > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${load}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-200">{load}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Edge Services & Micro-Processes Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isKz ? 'Өндірістік ядро сервистері мен демондары' : 'Микросервисы и процессы промышленного ядра'}
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            6 / 6 ALL HEALTHY
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2.5 font-semibold">СЕРВИС / БИНАРНИК</th>
                <th className="pb-2.5 font-semibold">НАЗНАЧЕНИЕ</th>
                <th className="pb-2.5 font-semibold">PID</th>
                <th className="pb-2.5 font-semibold">CPU</th>
                <th className="pb-2.5 font-semibold">RAM</th>
                <th className="pb-2.5 font-semibold">UPTIME</th>
                <th className="pb-2.5 font-semibold">СТАТУС</th>
                <th className="pb-2.5 font-semibold text-right">ДЕЙСТВИЕ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                      <div>
                        <div>{svc.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{svc.binary}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-400 text-[11px] max-w-[200px] truncate">{svc.role}</td>
                  <td className="py-2.5 text-cyan-300">{svc.pid}</td>
                  <td className="py-2.5">{svc.cpu}%</td>
                  <td className="py-2.5">{svc.memoryMb} MB</td>
                  <td className="py-2.5 text-slate-400">{svc.uptime}</td>
                  <td className="py-2.5">
                    {svc.status === 'running' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                        RUNNING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold animate-pulse">
                        RESTARTING...
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRestartService(svc.id)}
                      disabled={svc.status === 'restarting'}
                      className="px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900 text-[11px] text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors"
                      title="Перезапустить процесс демона"
                    >
                      {isKz ? 'Қайта қосу' : 'Перезапуск'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Plant Broadcast Dispatcher (Шұғыл хабарлама / Оповещение цехов) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isKz ? 'Шұғыл цехтық хабарландыру тарату (Plant Broadcast)' : 'Шлюз экстренного оповещения цехов (Plant Broadcast)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isKz
                  ? 'Барлық қосылған цехтардың мониторлары мен операторларына жедел хабарлама жіберу'
                  : 'Мгновенная рассылка предупреждений на мониторы операторов всех производственных цехов'}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs font-mono text-slate-400">
            MQTT / WebSocket Push
          </span>
        </div>

        {broadcastSuccess && (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>
              {isKz
                ? 'Хабарлама барлық цехтарға сәтті жіберілді және жедел мониторларға шығарылды!'
                : 'Оповещение успешно отправлено на все цеховые посты и терминалы операторов!'}
            </span>
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isKz ? 'Категория' : 'Категория предупреждения'}
              </label>
              <select
                value={broadcastCategory}
                onChange={(e) => setBroadcastCategory(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-hidden"
              >
                <option value="safety">🚨 Техника безопасности (СИЗ / Опасные зоны)</option>
                <option value="eco">🌿 Экологический контроль (ПДК / Вентиляция)</option>
                <option value="maintenance">⚙️ Техническое обслуживание оборудования</option>
                <option value="general">📢 Общее производственное объявление</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isKz ? 'Қай цехқа бағытталған' : 'Целевой производственный участок'}
              </label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-hidden"
              >
                <option value="all">🌐 Все цеха и производственные комплексы</option>
                <option value="foundry">🔥 Литейный цех (Участок дуговой печи)</option>
                <option value="chemical">🧪 Химико-гальванический комплекс</option>
                <option value="assembly">⚙️ Сборочный цех и конвейерная линия</option>
                <option value="energy">⚡ Энергоблок и компрессорная станция</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isKz ? 'Хабарлама мәтіні' : 'Текст экстренного оповещения'}
            </label>
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder={
                isKz
                  ? 'Мысалы: Литейный цехта жоспарлы экологиялық өлшеу, СИЗ кию міндетті'
                  : 'Например: Внимание всем цехам! Плановый контроль герметичности фильтров, надеть СИЗ'
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 mr-1">{isKz ? 'Үлгілер:' : 'Быстрые шаблоны:'}</span>
            <button
              type="button"
              onClick={() =>
                setBroadcastMessage(
                  isKz
                    ? 'Назар аударыңыз! Барлық цехтарда қорғаныс шлемдері мен көзілдіріктерді тексеру жүруде'
                    : 'Внимание всем цехам! Проводится внеплановая проверка наличия защитных касок и очков'
                )
              }
              className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40"
            >
              СИЗ проверка
            </button>
            <button
              type="button"
              onClick={() =>
                setBroadcastMessage(
                  isKz
                    ? 'Ауа желдеткішін қосу: ПДК SO2 шекті мәніне жақындады'
                    : 'Включить принудительную вытяжку: приближение к порогу ПДК по газу SO2'
                )
              }
              className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40"
            >
              ПДК вентиляция
            </button>
            <button
              type="button"
              onClick={() =>
                setBroadcastMessage(
                  isKz
                    ? 'Құрал-жабдықтарды тексеру: компрессор станциясында май қысымының ауытқуы'
                    : 'Осмотр насосного агрегата: зафиксирована повышенная вибрация по ISO 10816'
                )
              }
              className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40"
            >
              Вибрация агрегата
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={!broadcastMessage.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-cyan-900/30 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{isKz ? 'Оповещение жіберу' : 'Разослать оповещение'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

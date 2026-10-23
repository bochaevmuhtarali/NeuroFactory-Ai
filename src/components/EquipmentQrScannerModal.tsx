import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  IndustrialMachine,
  Language,
  MaintenanceRecord,
} from '../types';
import { translations } from '../i18n/translations';
import { playQrSuccessScanSound, playPingSound } from '../utils/industrialAudio';
import {
  QrCode,
  Camera,
  X,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Clock,
  Wrench,
  RotateCcw,
  ExternalLink,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building2,
  Cpu,
  Sparkles,
  Info,
} from 'lucide-react';

interface EquipmentQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: IndustrialMachine[];
  language: Language;
  onDispatchWorkOrder?: (machineId: string) => void;
  onNavigateToFailPredict?: (machineId: string) => void;
}

export const EquipmentQrScannerModal: React.FC<EquipmentQrScannerModalProps> = ({
  isOpen,
  onClose,
  machines,
  language,
  onDispatchWorkOrder,
  onNavigateToFailPredict,
}) => {
  const t = translations[language];

  // Active view tabs within scanner: 'camera' | 'samples' | 'upload'
  const [activeMode, setActiveMode] = useState<'camera' | 'samples' | 'upload'>('camera');

  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedResult, setScannedResult] = useState<IndustrialMachine | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workOrderNotice, setWorkOrderNotice] = useState<boolean>(false);
  const [sampleQrDataUrls, setSampleQrDataUrls] = useState<Record<string, string>>({});
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Video and Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  // Generate crisp QR code data URLs for sample tags
  useEffect(() => {
    let isMounted = true;
    async function generateQrs() {
      const urls: Record<string, string> = {};
      for (const m of machines) {
        const payload = m.tagNumber || m.id;
        try {
          const url = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
              dark: '#020617', // slate-950
              light: '#ffffff',
            },
            width: 200,
          });
          urls[m.id] = url;
        } catch (e) {
          console.warn('Error generating sample QR:', e);
        }
      }
      if (isMounted) {
        setSampleQrDataUrls(urls);
      }
    }
    if (machines.length > 0) {
      generateQrs();
    }
    return () => {
      isMounted = false;
    };
  }, [machines]);

  // Handle machine selection from scanned string
  const handleResolveCode = useCallback((rawCode: string) => {
    const cleanCode = rawCode.trim();
    // Try matching by id, tagNumber, or serialNumber, or case-insensitive substring
    let matched = machines.find(
      (m) =>
        m.id.toLowerCase() === cleanCode.toLowerCase() ||
        (m.tagNumber && m.tagNumber.toLowerCase() === cleanCode.toLowerCase()) ||
        (m.serialNumber && m.serialNumber.toLowerCase() === cleanCode.toLowerCase())
    );

    // If string is JSON
    if (!matched && cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanCode);
        const targetId = parsed.id || parsed.tag || parsed.tagNumber;
        if (targetId) {
          matched = machines.find(
            (m) =>
              m.id.toLowerCase() === String(targetId).toLowerCase() ||
              (m.tagNumber && m.tagNumber.toLowerCase() === String(targetId).toLowerCase())
          );
        }
      } catch {}
    }

    // Fallback: search by partial text
    if (!matched) {
      matched = machines.find(
        (m) =>
          m.name.toLowerCase().includes(cleanCode.toLowerCase()) ||
          cleanCode.toLowerCase().includes(m.id.toLowerCase())
      );
    }

    if (matched) {
      playQrSuccessScanSound();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 100]);
      }
      setScannedResult(matched);
      setWorkOrderNotice(false);
      // Stop camera scan loop while inspecting
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    } else {
      playPingSound();
      alert(t.safevision.noMachineFound + `: "${cleanCode}"`);
    }
  }, [machines, t.safevision.noMachineFound]);

  // Video scanning tick loop using requestAnimationFrame + jsQR
  const tickScan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleResolveCode(code.data);
          return; // Stop loop once resolved
        }
      }
    }
    scanLoopRef.current = requestAnimationFrame(tickScan);
  }, [handleResolveCode]);

  // Start video stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setIsCameraActive(true);
        scanLoopRef.current = requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);
      setCameraError(
        t.safevision.cameraPermissionError ||
          'Доступ к камере заблокирован или устройство отсутствует. Воспользуйтесь тестовыми бирками.'
      );
    }
  }, [facingMode, tickScan, t.safevision.cameraPermissionError]);

  // Stop video stream
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Manage camera lifecycle based on modal openness & activeMode
  useEffect(() => {
    if (isOpen && activeMode === 'camera' && !scannedResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, scannedResult, startCamera, stopCamera]);

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          setIsProcessingFile(false);
          if (code && code.data) {
            handleResolveCode(code.data);
          } else {
            alert('QR-код не обнаружен на данном изображении. Попробуйте четкую фотографию бирки крупным планом.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = '';
  };

  // Work order dispatch
  const handleDispatchWorkOrderClick = () => {
    if (!scannedResult) return;
    if (onDispatchWorkOrder) {
      onDispatchWorkOrder(scannedResult.id);
    }
    setWorkOrderNotice(true);
    playPingSound();
  };

  // Reset and resume scanning
  const handleResetScanner = () => {
    setScannedResult(null);
    setWorkOrderNotice(false);
    if (activeMode === 'camera') {
      startCamera();
    }
  };

  // Filter machines for manual search input
  const filteredMachines = machines.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      (m.tagNumber && m.tagNumber.toLowerCase().includes(q)) ||
      (m.serialNumber && m.serialNumber.toLowerCase().includes(q)) ||
      m.area.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {t.safevision.scanQrTitle}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-md bg-cyan-950 border border-cyan-800/80 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>SafeVision Edge Scanner</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {t.safevision.scanQrSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* If a machine has been scanned and recognized, show Equipment Passport */}
          {scannedResult ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Top Banner with Scanned Machine Summary */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300">
                        {scannedResult.tagNumber || scannedResult.id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        S/N: {scannedResult.serialNumber || 'N/A'}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {scannedResult.area}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {scannedResult.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {scannedResult.type} · {t.safevision.manufacturerLabel}: <span className="text-slate-200">{scannedResult.manufacturer || 'Уралмаш / Тяжмаш'}</span> (Ввод: {scannedResult.installedYear} г.)
                    </p>
                  </div>

                  {/* Actions in Header */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetScanner}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{t.safevision.scanAnotherTag}</span>
                    </button>
                    {onNavigateToFailPredict && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToFailPredict(scannedResult.id);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                      >
                        <Activity className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{t.safevision.goToFailPredict}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-850">
                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1">
                    <div className="text-[11px] text-slate-400 font-medium">Статус риска ISO 10816</div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          scannedResult.riskStatus === 'critical'
                            ? 'bg-rose-500 animate-ping'
                            : scannedResult.riskStatus === 'high'
                            ? 'bg-amber-400'
                            : scannedResult.riskStatus === 'medium'
                            ? 'bg-yellow-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span
                        className={`text-xs font-bold uppercase font-mono ${
                          scannedResult.riskStatus === 'critical'
                            ? 'text-rose-400'
                            : scannedResult.riskStatus === 'high'
                            ? 'text-amber-400'
                            : scannedResult.riskStatus === 'medium'
                            ? 'text-yellow-300'
                            : 'text-emerald-400'
                        }`}
                      >
                        {scannedResult.riskStatus}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Вероятность отказа: {scannedResult.failureProbabilityPercent}%
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1">
                    <div className="text-[11px] text-slate-400 font-medium">Вибрация RMS</div>
                    <div className="text-base font-bold font-mono text-cyan-300">
                      {scannedResult.vibrationRmsMmS} мм/с
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Базовый уровень: {scannedResult.vibrationBaselineMmS} мм/с
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1">
                    <div className="text-[11px] text-slate-400 font-medium">Температура опор</div>
                    <div className="text-base font-bold font-mono text-white">
                      {scannedResult.temperatureC} °C
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Норма: {scannedResult.temperatureBaselineC} °C
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1">
                    <div className="text-[11px] text-slate-400 font-medium">Остаточный ресурс RUL</div>
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {scannedResult.remainingUsefulLifeHours} ч
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {Math.round(scannedResult.remainingUsefulLifeHours / 24)} сут. эксплуатации
                    </div>
                  </div>
                </div>

                {/* Active Engineering Recommendation & Work Order Action */}
                <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Wrench className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-bold text-amber-300">
                        {language === 'kz' ? 'Инженерлік ұсыныс (FailPredict AI)' : 'Инженерное предписание (FailPredict AI)'}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {scannedResult.recommendations[language]}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-900/30">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{t.safevision.installedYearLabel}: {scannedResult.installedYear}</span>
                      <span className="text-slate-600">|</span>
                      <span>{t.safevision.nextServiceDueLabel}: <strong className="text-slate-200">15.11.2026</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDispatchWorkOrderClick}
                      disabled={scannedResult.hasActiveWorkOrder || workOrderNotice}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        scannedResult.hasActiveWorkOrder || workOrderNotice
                          ? 'bg-emerald-950 border border-emerald-600 text-emerald-300 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {scannedResult.hasActiveWorkOrder || workOrderNotice
                          ? t.failpredict.workOrderCreated
                          : t.safevision.dispatchWorkOrderBtn}
                      </span>
                    </button>
                  </div>

                  {workOrderNotice && (
                    <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-300 font-mono animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>{t.safevision.workOrderCreatedNotice}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance History Timeline Section */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      {t.safevision.maintenanceLogTitle}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {scannedResult.maintenanceHistory?.length || 0} записей в реестре ТОиР
                  </span>
                </div>

                {scannedResult.maintenanceHistory && scannedResult.maintenanceHistory.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {scannedResult.maintenanceHistory.map((rec) => (
                      <div key={rec.id} className="relative group">
                        {/* Bullet node on line */}
                        <div
                          className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 bg-slate-950 flex items-center justify-center transition-all ${
                            rec.status === 'in_progress'
                              ? 'border-amber-400 bg-amber-950'
                              : rec.type === 'emergency'
                              ? 'border-rose-500 bg-rose-950'
                              : 'border-emerald-500 bg-emerald-950'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              rec.status === 'in_progress'
                                ? 'bg-amber-400 animate-pulse'
                                : rec.type === 'emergency'
                                ? 'bg-rose-500'
                                : 'bg-emerald-400'
                            }`}
                          />
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-2 hover:border-slate-700 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-cyan-300">
                                {rec.date}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                                  rec.type === 'emergency'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : rec.type === 'vibration_audit'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : rec.type === 'overhaul'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {rec.type}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                                  rec.status === 'completed'
                                    ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-900'
                                    : rec.status === 'in_progress'
                                    ? 'text-amber-400 bg-amber-950/60 border border-amber-900'
                                    : 'text-slate-400 bg-slate-800'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </div>
                            {rec.hoursAtService && (
                              <span className="text-[11px] font-mono text-slate-400">
                                Наработка: <strong className="text-slate-200">{rec.hoursAtService.toLocaleString()} ч</strong>
                              </span>
                            )}
                          </div>

                          <h5 className="text-xs font-bold text-white">
                            {rec.title[language]}
                          </h5>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {rec.details[language]}
                          </p>

                          {rec.partsReplaced && rec.partsReplaced.length > 0 && (
                            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="text-slate-500 font-mono text-[10px]">Заменено:</span>
                              {rec.partsReplaced.map((part, pidx) => (
                                <span
                                  key={pidx}
                                  className="rounded bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300 font-mono"
                                >
                                  {part}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
                            <span>{t.safevision.technicianLabel}: <strong className="text-slate-300 font-sans">{rec.technician}</strong></span>
                            {rec.nextServiceDue && (
                              <span className="text-[10px] text-slate-500">Следующее ТО: {rec.nextServiceDue}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-lg">
                    История обслуживания данного узла еще не внесена в электронный реестр.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Scanner Controls & Viewfinder */
            <div className="space-y-6">
              {/* Mode Switcher Tabs */}
              <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('camera');
                    startCamera();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
                    activeMode === 'camera'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>{t.safevision.startCamera}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('samples');
                    stopCamera();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
                    activeMode === 'samples'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>{t.safevision.sampleTagsTitle}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('upload');
                    stopCamera();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
                    activeMode === 'upload'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>{t.safevision.uploadQrPhoto}</span>
                </button>
              </div>

              {/* MODE 1: Camera Scanner Viewfinder */}
              {activeMode === 'camera' && (
                <div className="space-y-4">
                  <div className="relative aspect-video max-h-[380px] w-full rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Viewfinder Target Reticle Overlay */}
                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-56 h-56 border-2 border-cyan-400/50 rounded-2xl">
                          {/* Corner markers */}
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                          {/* Animated laser scan line */}
                          <div className="absolute inset-x-0 h-[2px] bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)] animate-scanline" />
                        </div>
                      </div>
                    )}

                    {/* Camera Off / Error State Overlay */}
                    {(!isCameraActive || cameraError) && (
                      <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                          <Camera className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div className="max-w-md space-y-1">
                          <p className="text-xs font-semibold text-white">
                            {cameraError ? 'Камера недоступна' : 'Камера ожидает активации'}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {cameraError || t.safevision.cameraActive}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors"
                          >
                            {t.safevision.startCamera}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveMode('samples')}
                            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                          >
                            {t.safevision.sampleTagsTitle}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Camera Overlay Controls */}
                    {isCameraActive && (
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleToggleFacingMode}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-950/80 border border-white/10 px-2.5 py-1.5 text-[11px] font-mono text-white backdrop-blur-md hover:bg-slate-900 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                          <span>{t.safevision.switchCamera}</span>
                        </button>
                      </div>
                    )}

                    {/* Bottom HUD info */}
                    {isCameraActive && (
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between rounded-lg bg-slate-950/80 border border-white/10 px-3 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{t.safevision.cameraActive}</span>
                        </div>
                        <span className="text-cyan-400 text-[10px]">YOLOv11 Tag Detector</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 2: Sample Industrial Equipment Plates & QR Codes */}
              {activeMode === 'samples' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <Info className="h-4 w-4 text-cyan-400 shrink-0" />
                    <p className="leading-relaxed">
                      {t.safevision.sampleTagsDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {machines.map((m) => {
                      const qrUrl = sampleQrDataUrls[m.id];
                      return (
                        <div
                          key={m.id}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-start gap-4">
                            {/* Realistic Industrial Metal Nameplate Tag with QR */}
                            <div className="relative shrink-0 rounded-lg p-2 bg-gradient-to-b from-slate-200 to-slate-400 border border-slate-500 shadow-md">
                              {/* Rivets */}
                              <div className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-slate-600 border border-slate-400" />
                              <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-slate-600 border border-slate-400" />
                              <div className="absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full bg-slate-600 border border-slate-400" />
                              <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-slate-600 border border-slate-400" />

                              {qrUrl ? (
                                <img
                                  src={qrUrl}
                                  alt={`QR for ${m.name}`}
                                  className="h-24 w-24 object-contain rounded"
                                />
                              ) : (
                                <div className="h-24 w-24 bg-white flex items-center justify-center">
                                  <QrCode className="h-12 w-12 text-slate-800 animate-spin" />
                                </div>
                              )}
                              <div className="text-[9px] font-mono text-center font-black text-slate-900 tracking-tighter mt-0.5">
                                {m.tagNumber || m.id}
                              </div>
                            </div>

                            {/* Tag Details */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold truncate">
                                  {m.tagNumber || m.id}
                                </span>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                    m.riskStatus === 'critical'
                                      ? 'text-rose-400 bg-rose-950 border border-rose-800'
                                      : m.riskStatus === 'high'
                                      ? 'text-amber-400 bg-amber-950 border border-amber-800'
                                      : 'text-emerald-400 bg-emerald-950 border border-emerald-800'
                                  }`}
                                >
                                  {m.riskStatus}
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-white truncate" title={m.name}>
                                {m.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {m.area}
                              </p>

                              <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                                <div>Вибрация: <strong className="text-slate-200">{m.vibrationRmsMmS} мм/с</strong></div>
                                <div>Ресурс RUL: <strong className="text-emerald-400">{m.remainingUsefulLifeHours} ч</strong></div>
                              </div>
                            </div>
                          </div>

                          {/* Quick Simulate Scan Button */}
                          <button
                            type="button"
                            onClick={() => handleResolveCode(m.tagNumber || m.id)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-colors"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>{t.safevision.testScanNow} ({m.tagNumber || m.id})</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE 3: Upload Image File */}
              {activeMode === 'upload' && (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-10 hover:border-cyan-500/50 bg-slate-950 cursor-pointer transition-colors">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 mb-3">
                      <Upload className={`h-6 w-6 text-cyan-400 ${isProcessingFile ? 'animate-bounce' : ''}`} />
                    </div>
                    <span className="text-xs font-bold text-white mb-1">
                      {isProcessingFile ? 'Распознавание шильдика...' : 'Выберите файл или перетащите фото шильдика'}
                    </span>
                    <span className="text-[11px] text-slate-400 text-center max-w-sm">
                      Поддерживаются форматы JPG, PNG, WEBP. Система выполнит оптическое считывание QR-кода узла.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Quick Search / Direct ID Selection Bar */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.safevision.manualSearchPlaceholder}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {searchQuery.trim() !== '' && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 divide-y divide-slate-850 max-h-48 overflow-y-auto no-scrollbar">
                    {filteredMachines.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleResolveCode(m.tagNumber || m.id)}
                        className="w-full text-left p-3 hover:bg-slate-900 flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white">{m.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {m.tagNumber || m.id} · {m.area}
                          </div>
                        </div>
                        <span className="text-cyan-400 text-[11px] flex items-center gap-1 font-mono">
                          <span>Открыть</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="border-t border-slate-800 bg-slate-950 px-5 py-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>ISO 10816-3 & ГОСТ 32106-2013</span>
          </div>
          <div>
            База оборудования: <strong className="text-slate-200">{machines.length} агрегатов</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

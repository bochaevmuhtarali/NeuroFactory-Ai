import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { CompanyLogo } from './CompanyLogo';
import { SystemPerformanceMonitor } from './SystemPerformanceMonitor';
import {
  fetchTickets,
  addTicketReply,
  updateTicketStatus,
} from '../services/supportService';
import { SupportTicket, SupportTicketStatus } from '../types/support';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Server,
  Activity,
  Layers,
  Database,
  User,
  Phone,
  Mail,
  Building,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogOut,
  Sliders,
  RotateCcw,
  Sparkles,
  Camera,
  Leaf,
  Wrench,
  Radio,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  LifeBuoy,
  MessageSquare,
  Send,
  Clock,
  Inbox,
  Filter,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onAddCamera?: (camera: any) => void;
  onAddSensor?: (sensor: any) => void;
  onAddMachine?: (machine: any) => void;
  onResetToZero?: () => void;
  onLoadDemoData?: () => void;
  isHardwareConnected: boolean;
  initialTab?: 'general' | 'telemetry' | 'system' | 'audit' | 'tickets';
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  language,
  onAddCamera,
  onAddSensor,
  onAddMachine,
  onResetToZero,
  onLoadDemoData,
  isHardwareConnected,
  initialTab,
}) => {
  const {
    currentUser,
    profile,
    adminProfile,
    updateAdminProfile,
    setHardwareConnectedState,
    logout,
    isLoading,
  } = useAuth();

  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'general' | 'telemetry' | 'system' | 'audit' | 'tickets'>(
    initialTab || 'general'
  );

  // Tickets state for Founder inbox
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [founderReplyText, setFounderReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [accessLevel, setAccessLevel] = useState(4);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Status feedback
  const [isSaved, setIsSaved] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Quick Device Add form states
  const [quickDeviceType, setQuickDeviceType] = useState<'camera' | 'sensor' | 'machine'>('camera');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceArea, setNewDeviceArea] = useState('Цех №1 (Конвертерный)');
  const [deviceAddedSuccess, setDeviceAddedSuccess] = useState<string | null>(null);

  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const handleCopy = (text: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const loadFounderTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const list = await fetchTickets(
        adminProfile?.email || currentUser?.email || 'muhtaraliboc@gmail.com',
        currentUser?.uid,
        true
      );
      setTickets(list);
    } catch (e) {
      console.warn('Error loading support tickets for founder:', e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleFounderSendReply = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || founderReplyText;
    if (!selectedTicket || !textToSend.trim()) return;

    setIsSendingReply(true);
    try {
      const updated = await addTicketReply(
        selectedTicket.id,
        textToSend.trim(),
        adminProfile?.email || currentUser?.email || 'muhtaraliboc@gmail.com',
        'Бочаев Мухтарали (Основатель платформы)',
        true,
        selectedTicket.status === 'open' ? 'in_progress' : undefined
      );

      if (updated) {
        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }
      setFounderReplyText('');
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicketStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      loadFounderTickets();
    }
  }, [isOpen]);

  useEffect(() => {
    if (adminProfile) {
      setFullName(adminProfile.fullName || 'Бочаев Мухтарали');
      setEmail(adminProfile.email || currentUser?.email || 'bochaevmuhtarali@mail.ru');
      setPhone(adminProfile.phone || '+7 (777) 001-99-88');
      setDepartment(adminProfile.department || 'Департамент системной архитектуры и промышленной безопасности');
      setRole(adminProfile.role || 'Главный системный администратор NeuroFactory');
      setAccessLevel(adminProfile.accessLevel || 4);
      setTwoFactorEnabled(adminProfile.twoFactorEnabled !== false);
    }
  }, [adminProfile, currentUser]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaved(false);

    try {
      await updateAdminProfile({
        fullName,
        email,
        phone,
        department,
        role,
        accessLevel,
        twoFactorEnabled,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error updating administrator profile');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error during logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleToggleZeroMode = async (enableZero: boolean) => {
    if (enableZero) {
      if (onResetToZero) onResetToZero();
      await setHardwareConnectedState(false);
    } else {
      if (onLoadDemoData) onLoadDemoData();
      await setHardwareConnectedState(true);
    }
    setDeviceAddedSuccess(
      enableZero
        ? language === 'ru'
          ? 'Включен режим нового аккаунта: все датчики и камеры отключены, показатели равны 0'
          : 'Жаңа аккаунт режимі іске қосылды: барлық сенсорлар ажыратылған, көрсеткіштер нөлге тең'
        : language === 'ru'
          ? 'Демонстрационный стенд активирован: потоки и датчики подключены'
          : 'Сынақ стенді қосылды: ағындар мен сенсорлар іске қосылды'
    );
    setTimeout(() => setDeviceAddedSuccess(null), 4000);
  };

  const handleQuickAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    if (quickDeviceType === 'camera' && onAddCamera) {
      onAddCamera({
        id: 'cam-' + Date.now().toString(36),
        name: newDeviceName,
        area: newDeviceArea,
        fps: 25,
        resolution: '1920x1080 (60Hz)',
        status: 'active',
        currentDetections: {
          helmetsOk: 2,
          helmetsMissing: 0,
          vestsOk: 2,
          vestsMissing: 0,
          gogglesOk: 2,
          gogglesMissing: 0,
          inHazardZone: 0,
        },
      });
    } else if (quickDeviceType === 'sensor' && onAddSensor) {
      onAddSensor({
        id: 'sensor-' + Date.now().toString(36),
        name: newDeviceName,
        code: 'SO2',
        unit: 'мг/м³',
        currentValue: 0.18,
        thresholdWarning: 0.4,
        thresholdCritical: 0.5,
        area: newDeviceArea,
        status: 'normal',
        trend: 'stable',
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } else if (quickDeviceType === 'machine' && onAddMachine) {
      onAddMachine({
        id: 'mach-' + Date.now().toString(36),
        name: newDeviceName,
        type: 'Промышленный насосный агрегат',
        area: newDeviceArea,
        installedYear: 2023,
        temperatureC: 48.5,
        temperatureBaselineC: 45.0,
        vibrationRmsMmS: 2.1,
        vibrationBaselineMmS: 1.8,
        peakFrequencyHz: 25.0,
        riskStatus: 'low',
        failureProbabilityPercent: 12,
        remainingUsefulLifeHours: 4200,
        recommendations: {
          ru: 'Штатная эксплуатация, показатели в норме ISO 10816-3',
          kz: 'Штаттық пайдалану, көрсеткіштер ISO 10816-3 бойынша қалыпты',
        },
        lastInspectionDate: new Date().toISOString().split('T')[0],
        telemetryHistory: [
          { time: '10:00', temp: 48.0, vibration: 2.0 },
          { time: '11:00', temp: 48.5, vibration: 2.1 },
        ],
      });
    }

    setDeviceAddedSuccess(`Оборудование "${newDeviceName}" успешно подключено к шлюзу Edge`);
    setNewDeviceName('');
    setTimeout(() => setDeviceAddedSuccess(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-900/60 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <CompanyLogo size="sm" withText={false} glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.admin.title}
                </h2>
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  Основатель платформы
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Кабинет основателя и главного архитектора NeuroFactory AI · Бочаев Мухтарали
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Identity & Status Hero Bar */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 p-0.5 shadow-md flex items-center justify-center text-white font-bold font-mono text-base">
                МБ
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span>{adminProfile?.fullName || 'Бочаев Мухтарали'}</span>
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    ({adminProfile?.email || currentUser?.email || 'bochaevmuhtarali@mail.ru'})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="text-cyan-400 font-medium">
                    {adminProfile?.role || 'Основатель и главный системный администратор'}
                  </span>
                  <span>·</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    2FA: Hardware Token OK
                  </span>
                  <span>·</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Доступ: Уровень {accessLevel} (Root)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono">
              <span className={`h-2 w-2 rounded-full ${isHardwareConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300">
                {isHardwareConnected ? 'Стенд: Потоки активны' : 'Стенд: Режим нуля (0 устройств)'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 text-xs font-semibold uppercase tracking-wider overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span>{t.admin.tabGeneral}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tickets');
              setSelectedTicket(null);
            }}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="h-4 w-4" />
            <span>Заявки техподдержки</span>
            {tickets.filter((t) => t.status === 'open').length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse">
                {tickets.filter((t) => t.status === 'open').length} новых
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
                {tickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'telemetry'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>{t.admin.tabTelemetry}</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>{language === 'kz' ? 'Өнімділік пен ядро (CPU/RAM)' : 'Монитор CPU/RAM и ядро'}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping hidden sm:inline-block" />
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>{t.admin.tabAudit}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isSaved && (
            <div className="rounded-lg bg-emerald-950/60 border border-emerald-800 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{t.admin.savedSuccess}</span>
            </div>
          )}

          {deviceAddedSuccess && (
            <div className="rounded-lg bg-cyan-950/60 border border-cyan-800 p-3 text-xs text-cyan-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>{deviceAddedSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="rounded-lg bg-rose-950/60 border border-rose-800 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{saveError}</span>
            </div>
          )}

          {/* TAB 0: Founder Support Inbox (Заявки техподдержки) */}
          {activeTab === 'tickets' && (
            <div className="space-y-5">
              {selectedTicket ? (
                /* Ticket Detail & Founder Reply Console */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Назад ко всем заявкам</span>
                    </button>

                    {/* Status Switcher Buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                      <span className="text-[11px] text-slate-500 px-2">Статус:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          selectedTicket.status === 'open'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Открыта
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          selectedTicket.status === 'in_progress'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        В работе
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          selectedTicket.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Решено
                      </button>
                    </div>
                  </div>

                  {/* Ticket Header & Requester Details */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-cyan-400">
                            {selectedTicket.id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                              selectedTicket.priority === 'urgent'
                                ? 'bg-red-950 text-red-300 border-red-700 animate-pulse'
                                : selectedTicket.priority === 'high'
                                ? 'bg-amber-950 text-amber-300 border-amber-700'
                                : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            }`}
                          >
                            {selectedTicket.priority === 'urgent'
                              ? 'КРИТИЧЕСКИЙ'
                              : selectedTicket.priority === 'high'
                              ? 'ВЫСОКИЙ'
                              : 'ОБЫЧНЫЙ'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {selectedTicket.category.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">
                          {selectedTicket.subject}
                        </h3>
                      </div>

                      <span className="text-xs font-mono text-slate-400">
                        {new Date(selectedTicket.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>

                    {/* Requester Contact Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1 text-slate-300">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <User className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="truncate">{selectedTicket.userName || 'Инженер'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="truncate">{selectedTicket.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <Building className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="truncate">{selectedTicket.factoryName || 'Предприятие РК'}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="mt-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/50">
                      <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">
                        Описание проблемы от пользователя:
                      </div>
                      <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.message}
                      </div>
                    </div>
                  </div>

                  {/* Conversation & Replies */}
                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                      <span>История ответов и переписки</span>
                    </h4>

                    {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                        Вы еще не ответили на эту заявку. Напишите ответ ниже, чтобы помочь предприятию.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedTicket.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className={`p-3.5 rounded-xl border ${
                              rep.isFounder
                                ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500/40 ml-4'
                                : 'bg-slate-950 border-slate-800 mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {rep.senderName}
                                </span>
                                {rep.isFounder && (
                                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Основатель проекта
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(rep.createdAt).toLocaleString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {rep.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Response Templates */}
                    <div className="pt-2">
                      <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                        Быстрые ответы основателя:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'RTSP-поток проверен, шлюз Edge перезапущен в штатный режим.',
                          'Калибровка ПДК выполнена по нормам Экологического кодекса РК.',
                          'Аномалия вибродиагностики локализована, сформирован техрегламент.',
                          'Заявку принял лично. Проверяем телеметрию вашего цеха.',
                        ].map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFounderReplyText(tpl)}
                            className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:border-cyan-500/50 hover:text-cyan-300 text-[11px] text-slate-300 transition-colors"
                          >
                            {tpl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Founder Direct Reply Box */}
                    <form onSubmit={(e) => handleFounderSendReply(e)} className="mt-3 space-y-2">
                      <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        <span>Ответ от имени: Бочаев Мухтарали (Основатель NeuroFactory AI)</span>
                      </div>
                      <textarea
                        rows={3}
                        value={founderReplyText}
                        onChange={(e) => setFounderReplyText(e.target.value)}
                        placeholder="Напишите профессиональные указания, подтверждение конфигурации или ответ клиенту..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/20 text-xs font-medium text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Пометить как Решено</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSendingReply || !founderReplyText.trim()}
                          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shadow-cyan-600/20"
                        >
                          {isSendingReply ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Отправить ответ пользователю</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                /* Tickets List View for Founder */
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/15">
                      <div className="text-[10px] font-mono text-red-300 uppercase">
                        Открытые заявки
                      </div>
                      <div className="text-xl font-bold text-white mt-1">
                        {tickets.filter((t) => t.status === 'open').length}
                      </div>
                      <div className="text-[10px] text-red-400/80 mt-0.5">
                        Требуют внимания
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/15">
                      <div className="text-[10px] font-mono text-amber-300 uppercase">
                        В работе
                      </div>
                      <div className="text-xl font-bold text-white mt-1">
                        {tickets.filter((t) => t.status === 'in_progress').length}
                      </div>
                      <div className="text-[10px] text-amber-400/80 mt-0.5">
                        В процессе решения
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/15">
                      <div className="text-[10px] font-mono text-emerald-300 uppercase">
                        Решено
                      </div>
                      <div className="text-xl font-bold text-white mt-1">
                        {tickets.filter((t) => t.status === 'resolved').length}
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        Инциденты закрыты
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        Всего обращений
                      </div>
                      <div className="text-xl font-bold text-white mt-1">
                        {tickets.length}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        С момента запуска
                      </div>
                    </div>
                  </div>

                  {/* Filters & Search Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      {[
                        { id: 'all', label: 'Все заявки' },
                        { id: 'open', label: 'Открыта заявка' },
                        { id: 'in_progress', label: 'В работе' },
                        { id: 'resolved', label: 'Решено' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setTicketStatusFilter(f.id as any)}
                          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                            ticketStatusFilter === f.id
                              ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={ticketSearchQuery}
                      onChange={(e) => setTicketSearchQuery(e.target.value)}
                      placeholder="Поиск по теме, предприятию, email..."
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Tickets List */}
                  {isLoadingTickets ? (
                    <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                      <span className="text-xs">Загрузка входящих заявок...</span>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                      <LifeBuoy className="h-8 w-8 mx-auto text-slate-500" />
                      <div className="text-sm font-medium text-slate-300">
                        Входящих заявок пока нет
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Как только клиенты или операторы цехов напишут в техническую поддержку, заявки моментально отобразятся в этом окне основателя.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tickets
                        .filter((t) => {
                          if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) {
                            return false;
                          }
                          if (ticketSearchQuery.trim()) {
                            const q = ticketSearchQuery.toLowerCase();
                            const matchSub = t.subject.toLowerCase().includes(q);
                            const matchEmail = t.userEmail?.toLowerCase().includes(q);
                            const matchFact = t.factoryName?.toLowerCase().includes(q);
                            return matchSub || matchEmail || matchFact;
                          }
                          return true;
                        })
                        .map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTicket(t)}
                            className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-cyan-500/50 hover:bg-slate-950 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-mono text-cyan-400">
                                  {t.id.slice(-8)}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.2 rounded-full border font-bold ${
                                    t.status === 'resolved'
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                                      : t.status === 'in_progress'
                                      ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                      : 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
                                  }`}
                                >
                                  {t.status === 'resolved'
                                    ? 'Решено'
                                    : t.status === 'in_progress'
                                    ? 'В работе'
                                    : 'Открыта заявка'}
                                </span>

                                <span
                                  className={`text-[10px] px-2 py-0.2 rounded-full border ${
                                    t.priority === 'urgent'
                                      ? 'bg-red-950 text-red-400 border-red-800'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  {t.priority === 'urgent' ? 'Срочно' : t.category}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                {t.subject}
                              </h4>

                              <p className="text-xs text-slate-400 line-clamp-1">
                                {t.message}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 pt-0.5">
                                <span className="text-slate-300">{t.userName || t.userEmail}</span>
                                <span>·</span>
                                <span>{t.factoryName}</span>
                                <span>·</span>
                                <span>{new Date(t.createdAt).toLocaleDateString('ru-RU')}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {t.replies && t.replies.length > 0 && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                  {t.replies.length} ответа
                                </span>
                              )}
                              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: General Credentials */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Official Credentials Banner */}
              <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      {language === 'kz' ? 'Бас әкімшінің кіру деректері' : 'Учетные данные главного администратора'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    SuperAdmin
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
                        Логин / Email
                      </div>
                      <div className="text-white font-semibold mt-0.5 select-all">
                        bochaevmuhtarali@mail.ru
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('bochaevmuhtarali@mail.ru', 'email')}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title={copiedField === 'email' ? 'Скопировано' : 'Копировать'}
                    >
                      {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
                        Пароль администратора
                      </div>
                      <div className="text-cyan-300 font-bold mt-0.5 select-all tracking-wider font-mono">
                        {showAdminPassword ? 'Muha1122p' : '•••••••••'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        title={showAdminPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy('Muha1122p', 'password')}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        title={copiedField === 'password' ? 'Скопировано' : 'Копировать'}
                      >
                        {copiedField === 'password' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.admin.fullName} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.admin.email} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.admin.phone}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.admin.role}
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.admin.department}
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.admin.accessLevelLabel}
                  </label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={4}>Уровень 4 — Полный Root SuperAdmin (Все модули и БД)</option>
                    <option value={3}>Уровень 3 — Главный инженер диспетчерской</option>
                    <option value={2}>Уровень 2 — Инженер по охране труда и экологии</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white">
                      {t.admin.twoFactor}
                    </div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>{t.admin.twoFactorActive}</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isLoading ? t.admin.saving : t.admin.saveProfile}</span>
                </button>
              </div>
            </form>
          </div>
        )}

          {/* TAB 2: Telemetry & Zero-Indicator Mode Control */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Account Telemetry State Switcher */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-cyan-400" />
                      <span>{t.admin.zeroModeTitle}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      {t.admin.zeroModeDesc}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                      !isHardwareConnected
                        ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                        : 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${!isHardwareConnected ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      <span>{!isHardwareConnected ? 'Режим нуля (0)' : 'Стенд подключен'}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleToggleZeroMode(true)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-xs font-semibold transition-all ${
                      !isHardwareConnected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-200 shadow-sm'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-500/50 hover:text-white'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4 text-amber-400" />
                    <span>{t.admin.setZeroMode}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleZeroMode(false)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-xs font-semibold transition-all ${
                      isHardwareConnected
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200 shadow-sm'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/50 hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span>{t.admin.setDemoMode}</span>
                  </button>
                </div>
              </div>

              {/* Quick Device Provisioning Form */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyan-400" />
                    <span>{t.admin.quickAddTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Подключение нового технологического устройства в реальном времени. Показатели сразу обновятся в модулях.
                  </p>
                </div>

                {/* Device Type Selector */}
                <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1 gap-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setQuickDeviceType('camera')}
                    className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                      quickDeviceType === 'camera'
                        ? 'bg-cyan-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{t.admin.addCameraBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeviceType('sensor')}
                    className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                      quickDeviceType === 'sensor'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Leaf className="h-3.5 w-3.5" />
                    <span>{t.admin.addSensorBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeviceType('machine')}
                    className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                      quickDeviceType === 'machine'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>{t.admin.addMachineBtn}</span>
                  </button>
                </div>

                <form onSubmit={handleQuickAddDevice} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Наименование устройства / марка
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        quickDeviceType === 'camera'
                          ? 'CAM-05: Литейный двор печи №2'
                          : quickDeviceType === 'sensor'
                          ? 'Газоанализатор ОГ-4 (Агломерация)'
                          : 'Турбовентилятор ТВ-120 (Блок 3)'
                      }
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Участок размещения
                    </label>
                    <select
                      value={newDeviceArea}
                      onChange={(e) => setNewDeviceArea(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Цех №1 (Конвертерный)">Цех №1 (Конвертерный)</option>
                      <option value="Цех разливки стали">Цех разливки стали</option>
                      <option value="Агломерационный цех">Агломерационный цех</option>
                      <option value="Компрессорная станция №2">Компрессорная станция №2</option>
                      <option value="Сырьевой склад">Сырьевой склад</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors"
                    >
                      <span>Подключить к системе</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: System Diagnostics & Real-Time Performance Monitor */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <SystemPerformanceMonitor language={language} />

              {/* Cluster Hardware Nodes Architecture */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
                    {language === 'kz' ? 'Кластер архитектурасы мен тораптары' : 'Архитектура физических узлов кластера'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Node 1 */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Cpu className="h-4 w-4 text-cyan-400" />
                      <span>YOLOv11 Edge Vision Node</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>ONLINE</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Инференс:</span>
                      <span className="text-slate-200">25.4 FPS / TensorRT FP16</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Утилизация GPU:</span>
                      <span className="text-emerald-400">42% (NVIDIA A10G)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Задержка RTSP:</span>
                      <span className="text-slate-200">28 ms</span>
                    </div>
                  </div>
                </div>

                {/* Node 2 */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Leaf className="h-4 w-4 text-emerald-400" />
                      <span>LSTM EcoPredict Engine</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>ONLINE</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Горизонт прогноза:</span>
                      <span className="text-slate-200">24 часа (шаг 15 мин)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ошибка MSE:</span>
                      <span className="text-emerald-400">0.0034</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Протоколы опроса:</span>
                      <span className="text-slate-200">Modbus TCP, MQTT</span>
                    </div>
                  </div>
                </div>

                {/* Node 3 */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Activity className="h-4 w-4 text-amber-400" />
                      <span>ISO 10816 Vibration Engine</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>ONLINE</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Частота дискретизации:</span>
                      <span className="text-slate-200">25.6 кГц / 10240 линий</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FFT анализ:</span>
                      <span className="text-slate-200">Hanning window / RMS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Модель RUL:</span>
                      <span className="text-amber-400">Weibull Hazard Rate</span>
                    </div>
                  </div>
                </div>

                {/* Node 4 */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Database className="h-4 w-4 text-blue-400" />
                      <span>Cloud Firestore & Security Rules</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>PROTECTED</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Модель изоляции:</span>
                      <span className="text-emerald-400">Zero-Trust ABAC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Подключение:</span>
                      <span className="text-slate-200 truncate max-w-[150px]">Настроено</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Правила firestore.rules:</span>
                      <span className="text-emerald-400">Синхронизированы</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* TAB 4: Audit & Security Logs */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Журнал действий безопасности платформы</span>
                <span className="text-emerald-400">TLS 1.3 / Enterprise</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 divide-y divide-slate-800 text-xs font-mono">
                <div className="p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-white font-semibold">Аутентификация администратора Bochaev Muhtarali</div>
                    <div className="text-[11px] text-slate-400">Успешный вход в защищенную консоль Root Admin</div>
                  </div>
                  <span className="text-[11px] text-emerald-400">Сегодня, 11:10</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-white font-semibold">Валидация правил firestore.rules</div>
                    <div className="text-[11px] text-slate-400">Коллекции /factories и /admins защищены Zero-Trust</div>
                  </div>
                  <span className="text-[11px] text-cyan-400">Сегодня, 11:05</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-white font-semibold">Инициализация шлюза NeuroFactory Edge Gateway</div>
                    <div className="text-[11px] text-slate-400">Проверка готовности драйверов RTSP, Modbus, MQTT</div>
                  </div>
                  <span className="text-[11px] text-slate-400">Сегодня, 10:48</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-rose-900/50 bg-rose-950/20 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 hover:text-white hover:border-rose-600 transition-colors"
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
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

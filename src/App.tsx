import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { SafeVisionView } from './components/SafeVisionView';
import { EcoPredictView } from './components/EcoPredictView';
import { FailPredictView } from './components/FailPredictView';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminProfileModal } from './components/AdminProfileModal';
import { SupportTicketModal } from './components/SupportTicketModal';
import { ChatDrawer } from './components/ChatDrawer';
import { IndustrialSplashLoader } from './components/IndustrialSplashLoader';
import { ScrollController } from './components/ScrollController';
import { CompanyLogo } from './components/CompanyLogo';
import { fetchTickets } from './services/supportService';
import { Language, PPEViolation, EcoSensor, EcoReadingEvent, IndustrialMachine, IndustrialCamera } from './types';
import { translations } from './i18n/translations';
import { LifeBuoy, Bell } from 'lucide-react';

interface PlantBroadcastAlert {
  id: string;
  message: string;
  category: 'safety' | 'eco' | 'maintenance' | 'general';
  target: string;
  timestamp: string;
  sender: string;
}
import {
  INITIAL_CAMERAS,
  INITIAL_PPE_VIOLATIONS,
  INITIAL_ECO_SENSORS,
  INITIAL_ECO_READINGS,
  INITIAL_ECO_CHART_DATA,
  INITIAL_MACHINES,
} from './data/mockData';

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { currentUser, profile, isAdmin, setHardwareConnectedState } = useAuth();

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('neurofactory_lang') as Language) || 'ru';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('neurofactory_lang', lang);
  };

  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminModalInitialTab, setAdminModalInitialTab] = useState<'general' | 'telemetry' | 'system' | 'audit' | 'tickets'>('general');
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  // Boot test only shows when the user logs in or manually clicks Boot-Test / Diagnostics
  const [showSplash, setShowSplash] = useState<boolean>(false);

  const refreshTicketsCount = useCallback(async () => {
    // Only query Firestore if the current user is authenticated and is admin
    if (!currentUser || !isAdmin) {
      setOpenTicketsCount(0);
      return;
    }
    try {
      const list = await fetchTickets(currentUser.email, currentUser.uid, true);
      const openCount = list.filter((t) => t.status === 'open').length;
      setOpenTicketsCount(openCount);
    } catch (e) {
      console.warn('Error refreshing tickets count:', e);
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    refreshTicketsCount();
    const interval = setInterval(refreshTicketsCount, 30000);
    return () => clearInterval(interval);
  }, [refreshTicketsCount]);

  // Real-Time Plant Safety & Operational Broadcast Listener
  const [activeBroadcast, setActiveBroadcast] = useState<PlantBroadcastAlert | null>(() => {
    try {
      const raw = localStorage.getItem('neurofactory_active_broadcast');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleBroadcastEvent = (e: any) => {
      if (e.detail) {
        setActiveBroadcast(e.detail);
      }
    };
    window.addEventListener('neurofactory-broadcast', handleBroadcastEvent);
    return () => window.removeEventListener('neurofactory-broadcast', handleBroadcastEvent);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // If new account with no connected hardware, start with empty zero telemetry
  const isZeroAccount = profile?.hasConnectedHardware === false;

  // SafeVision live state
  const [cameras, setCameras] = useState<IndustrialCamera[]>(() =>
    isZeroAccount ? [] : INITIAL_CAMERAS
  );
  const [violations, setViolations] = useState<PPEViolation[]>(() =>
    isZeroAccount ? [] : INITIAL_PPE_VIOLATIONS
  );

  // EcoPredict live state
  const [ecoSensors, setEcoSensors] = useState<EcoSensor[]>(() =>
    isZeroAccount ? [] : INITIAL_ECO_SENSORS
  );
  const [ecoReadings, setEcoReadings] = useState<EcoReadingEvent[]>(() =>
    isZeroAccount ? [] : INITIAL_ECO_READINGS
  );
  const [ecoChartData, setEcoChartData] = useState(() =>
    isZeroAccount ? [] : INITIAL_ECO_CHART_DATA
  );

  // FailPredict live state
  const [machines, setMachines] = useState<IndustrialMachine[]>(() =>
    isZeroAccount ? [] : INITIAL_MACHINES
  );

  // Synchronize state when user switches between new account mode and demo mode
  useEffect(() => {
    if (profile) {
      if (profile.hasConnectedHardware === false) {
        setCameras([]);
        setViolations([]);
        setEcoSensors([]);
        setEcoReadings([]);
        setEcoChartData([]);
        setMachines([]);
      } else if (profile.hasConnectedHardware === true && cameras.length === 0) {
        setCameras(INITIAL_CAMERAS);
        setViolations(INITIAL_PPE_VIOLATIONS);
        setEcoSensors(INITIAL_ECO_SENSORS);
        setEcoReadings(INITIAL_ECO_READINGS);
        setEcoChartData(INITIAL_ECO_CHART_DATA);
        setMachines(INITIAL_MACHINES);
      }
    }
  }, [profile?.hasConnectedHardware]);

  // Hardware provisioning & demo toggle handlers
  const handleLoadDemoData = async () => {
    setCameras(INITIAL_CAMERAS);
    setViolations(INITIAL_PPE_VIOLATIONS);
    setEcoSensors(INITIAL_ECO_SENSORS);
    setEcoReadings(INITIAL_ECO_READINGS);
    setEcoChartData(INITIAL_ECO_CHART_DATA);
    setMachines(INITIAL_MACHINES);
    await setHardwareConnectedState(true);
  };

  const handleResetToZero = async () => {
    setCameras([]);
    setViolations([]);
    setEcoSensors([]);
    setEcoReadings([]);
    setEcoChartData([]);
    setMachines([]);
    await setHardwareConnectedState(false);
  };

  const handleAddCamera = (newCam: IndustrialCamera) => {
    setCameras((prev) => [newCam, ...prev]);
    setHardwareConnectedState(true);
  };

  const handleAddSensor = (newSensor: EcoSensor) => {
    setEcoSensors((prev) => [newSensor, ...prev]);
    setHardwareConnectedState(true);
  };

  const handleAddMachine = (newMach: IndustrialMachine) => {
    setMachines((prev) => [newMach, ...prev]);
    setHardwareConnectedState(true);
  };

  // SafeVision Handlers
  const handleUpdateViolationStatus = (id: string, newStatus: any) => {
    setViolations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
  };

  const handleSimulateViolation = () => {
    const newViol: PPEViolation = {
      id: 'viol-' + Date.now(),
      timestamp: new Date().toISOString(),
      cameraId: 'cam-01',
      cameraName: 'CAM-01: Конвертерный пролет (Кран №4)',
      area: 'Цех №1 (Конвертерный)',
      violationType: 'no_helmet',
      confidence: 0.97,
      workerCount: 1,
      status: 'new',
      notes: 'Смоделировано в реальном времени: персонал без каски в зоне монтажа',
    };

    setViolations((prev) => [newViol, ...prev]);

    // Update camera detections
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id === 'cam-01'
          ? {
              ...cam,
              currentDetections: {
                ...cam.currentDetections,
                helmetsMissing: cam.currentDetections.helmetsMissing + 1,
              },
            }
          : cam
      )
    );
  };

  // EcoPredict Handlers
  const handleSimulateEcoSpike = () => {
    const newReading: EcoReadingEvent = {
      id: 'eco-spike-' + Date.now(),
      sensorId: 'eco-s1',
      indicator: 'SO₂ (Диоксид серы)',
      value: 0.54,
      unit: 'мг/м³',
      threshold: 0.5,
      time: new Date().toISOString(),
      area: 'Агломерационный цех',
      status: 'critical',
      predictedPeakTime: 'Фиксация скачка! Продувка газоочистных скрубберов',
      mitigationAction: 'Снизить подачу шихты на аглоленту №2, запустить резервную дымососную станцию',
    };

    setEcoReadings((prev) => [newReading, ...prev]);

    setEcoSensors((prev) =>
      prev.map((s) =>
        s.code === 'SO2'
          ? { ...s, currentValue: 0.54, status: 'critical', trend: 'up' }
          : s
      )
    );
  };

  // FailPredict Handlers
  const handleDispatchWorkOrder = (machineId: string) => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === machineId ? { ...m, hasActiveWorkOrder: true } : m
      )
    );
  };

  const handleSimulateMachineAnomaly = () => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === 'mach-01'
          ? {
              ...m,
              vibrationRmsMmS: 8.4,
              temperatureC: 86.0,
              riskStatus: 'critical',
              failureProbabilityPercent: 94,
              remainingUsefulLifeHours: 24,
              telemetryHistory: [
                ...m.telemetryHistory,
                { time: '18:00', temp: 86.0, vibration: 8.4 },
              ],
            }
          : m
      )
    );
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={handleSetLanguage}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdminProfile={() => {
          setAdminModalInitialTab('general');
          setIsAdminOpen(true);
        }}
        onOpenAdminProfileWithTab={(tab) => {
          setAdminModalInitialTab(tab);
          setIsAdminOpen(true);
        }}
        onOpenSupport={() => setIsSupportOpen(true)}
        openTicketsCount={openTicketsCount}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onReplaySplash={() => setShowSplash(true)}
      />

      {/* Real-Time Plant Emergency & Safety Broadcast Banner */}
      {activeBroadcast && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-b border-amber-500/50 px-4 py-2.5 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 animate-pulse">
                <Bell className="h-4 w-4" />
              </span>
              <div className="flex items-baseline gap-2 truncate">
                <span className="font-bold font-mono text-amber-300 uppercase shrink-0">
                  {language === 'kz' ? 'ШҰҒЫЛ ХАБАРЛАМА:' : 'ЭКСТРЕННОЕ ОПОВЕЩЕНИЕ:'}
                </span>
                <span className="text-white font-medium truncate">{activeBroadcast.message}</span>
                <span className="text-slate-400 text-[10px] hidden md:inline shrink-0 font-mono">
                  ({activeBroadcast.sender} · {new Date(activeBroadcast.timestamp).toLocaleTimeString('ru-RU')})
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveBroadcast(null);
                try {
                  localStorage.removeItem('neurofactory_active_broadcast');
                } catch {
                  // ignored
                }
              }}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-xs hover:bg-slate-800 transition-colors shrink-0"
              title="Закрыть оповещение"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container with smooth view transition animation */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-8 animate-in fade-in duration-300">
        <div key={currentTab} className="transition-all duration-300">
        {currentTab === 'overview' && (
          <OverviewView
            onNavigate={setCurrentTab}
            language={language}
            camerasCount={cameras.length}
            sensorsCount={ecoSensors.length}
            machinesCount={machines.length}
            isHardwareConnected={cameras.length > 0}
            onLoadDemoData={handleLoadDemoData}
            onResetToZero={handleResetToZero}
          />
        )}

        {currentTab === 'safevision' && (
          <SafeVisionView
            cameras={cameras}
            violations={violations}
            machines={machines}
            onUpdateViolationStatus={handleUpdateViolationStatus}
            onSimulateViolation={handleSimulateViolation}
            onDispatchWorkOrder={handleDispatchWorkOrder}
            onNavigateToFailPredict={(machineId) => {
              setCurrentTab('failpredict');
            }}
            language={language}
            onAddCamera={handleAddCamera}
            onLoadDemoData={handleLoadDemoData}
          />
        )}

        {currentTab === 'ecopredict' && (
          <EcoPredictView
            sensors={ecoSensors}
            readings={ecoReadings}
            chartData={ecoChartData}
            onSimulateSpike={handleSimulateEcoSpike}
            language={language}
            onAddSensor={handleAddSensor}
            onLoadDemoData={handleLoadDemoData}
          />
        )}

        {currentTab === 'failpredict' && (
          <FailPredictView
            machines={machines}
            onDispatchWorkOrder={handleDispatchWorkOrder}
            onSimulateAnomaly={handleSimulateMachineAnomaly}
            language={language}
            onAddMachine={handleAddMachine}
            onLoadDemoData={handleLoadDemoData}
          />
        )}
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <CompanyLogo size="xs" withText={true} glow={false} />
              <span className="text-slate-600">·</span>
              <span className="font-normal text-slate-400 font-mono text-[11px]">
                {language === 'kz' ? 'Өндірістік ЖИ кешені' : 'Платформа промышленного ИИ'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Стандарты: ГОСТ 12.4.011-89 (СИЗ), Экологический кодекс РК (ПДК), ISO 10816-3 (Вибрация).
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 text-[11px] font-mono text-slate-400">
            <button
              onClick={() => setIsSupportOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 font-semibold"
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>Техподдержка (Заявка основателю)</span>
            </button>
            <span>·</span>
            <span>Cloud Firestore</span>
            <span>·</span>
            <span>© 2026 NeuroFactory AI</span>
          </div>
        </div>
      </footer>

      {/* Modals & AI Assistant Drawer */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={language}
        onLoginSuccess={() => setShowSplash(true)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        language={language}
        onOpenAdminProfile={() => {
          setIsProfileOpen(false);
          setAdminModalInitialTab('general');
          setIsAdminOpen(true);
        }}
        onOpenSupport={() => {
          setIsProfileOpen(false);
          setIsSupportOpen(true);
        }}
      />

      <AdminProfileModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        language={language}
        onAddCamera={handleAddCamera}
        onAddSensor={handleAddSensor}
        onAddMachine={handleAddMachine}
        onResetToZero={handleResetToZero}
        onLoadDemoData={handleLoadDemoData}
        isHardwareConnected={cameras.length > 0}
        initialTab={adminModalInitialTab}
      />

      <SupportTicketModal
        isOpen={isSupportOpen}
        onClose={() => {
          setIsSupportOpen(false);
          refreshTicketsCount();
        }}
        language={language}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        language={language}
      />

      {/* Floating smooth back-to-top button & reading depth indicator */}
      <ScrollController language={language} />

      {/* Industrial High-Tech Boot Splash Screen */}
      {showSplash && (
        <IndustrialSplashLoader
          onComplete={handleSplashComplete}
          language={language}
        />
      )}
    </div>
  );
}

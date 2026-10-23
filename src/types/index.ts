export type Language = 'ru' | 'kz';

export type TimeFilter = '1h' | '8h' | '24h' | '7d';

export type VerificationStatus = 'new' | 'verified' | 'false_positive' | 'resolved';

export interface UserProfile {
  userId: string;
  email: string;
  factoryName: string;
  region: string;
  industrySector?: string;
  contactPerson?: string;
  contactPhone?: string;
  emailVerified: boolean;
  hasConnectedHardware?: boolean;
  isNewAccount?: boolean;
  role?: string;
  isAdmin?: boolean;
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminProfile {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  accessLevel: number;
  phone?: string;
  department?: string;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  systemMetrics?: {
    yoloNodeStatus: 'healthy' | 'warning' | 'offline';
    lstmEcoStatus: 'healthy' | 'warning' | 'offline';
    vibrationCoreStatus: 'healthy' | 'warning' | 'offline';
    totalInferencesToday: number;
    activeNodesCount: number;
  };
  updatedAt?: string;
}

// SafeVision Types
export type PPEType = 'helmet' | 'vest' | 'goggles' | 'hazard_zone';

export interface PPEViolation {
  id: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  area: string;
  violationType: 'no_helmet' | 'no_vest' | 'no_goggles' | 'hazard_zone_entry';
  confidence: number;
  workerCount: number;
  status: VerificationStatus;
  notes?: string;
}

export interface IndustrialCamera {
  id: string;
  name: string;
  area: string;
  streamUrl?: string;
  fps: number;
  resolution: string;
  status: 'active' | 'offline' | 'calibrating';
  currentDetections: {
    helmetsOk: number;
    helmetsMissing: number;
    vestsOk: number;
    vestsMissing: number;
    gogglesOk: number;
    gogglesMissing: number;
    inHazardZone: number;
  };
}

// EcoPredict Types
export type EcoStatus = 'normal' | 'warning' | 'critical';

export interface EcoSensor {
  id: string;
  name: string;
  code: 'CO' | 'NO2' | 'SO2' | 'PM2_5' | 'PM10' | 'NOISE' | 'DUST' | 'TEMP';
  unit: string;
  currentValue: number;
  thresholdWarning: number;
  thresholdCritical: number;
  area: string;
  status: EcoStatus;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface EcoReadingEvent {
  id: string;
  sensorId: string;
  indicator: string;
  value: number;
  unit: string;
  threshold: number;
  time: string;
  area: string;
  status: EcoStatus;
  predictedPeakTime?: string;
  mitigationAction?: string;
}

export interface EcoChartPoint {
  time: string;
  timestamp: number;
  CO: number;
  NO2: number;
  SO2: number;
  PM2_5: number;
}

// FailPredict Types
export type MachineRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'routine' | 'preventive' | 'overhaul' | 'emergency' | 'vibration_audit';
  technician: string;
  title: {
    ru: string;
    kz: string;
  };
  details: {
    ru: string;
    kz: string;
  };
  partsReplaced?: string[];
  status: 'completed' | 'in_progress' | 'scheduled';
  nextServiceDue?: string;
  hoursAtService?: number;
}

export interface IndustrialMachine {
  id: string;
  tagNumber?: string;
  serialNumber?: string;
  manufacturer?: string;
  name: string;
  type: string;
  area: string;
  installedYear: number;
  temperatureC: number;
  temperatureBaselineC: number;
  vibrationRmsMmS: number;
  vibrationBaselineMmS: number;
  peakFrequencyHz: number;
  riskStatus: MachineRiskLevel;
  failureProbabilityPercent: number;
  remainingUsefulLifeHours: number;
  recommendations: {
    ru: string;
    kz: string;
  };
  hasActiveWorkOrder?: boolean;
  lastInspectionDate: string;
  maintenanceHistory?: MaintenanceRecord[];
  telemetryHistory: {
    time: string;
    temp: number;
    vibration: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

import {
  IndustrialCamera,
  PPEViolation,
  EcoSensor,
  EcoStatus,
  EcoReadingEvent,
  IndustrialMachine,
  MachineRiskLevel,
  TimeFilter,
} from '../types';

/**
 * Calculates overall PPE compliance score (0-100%) across cameras
 */
export function calculatePpeComplianceRate(cameras: IndustrialCamera[]): number {
  if (!cameras.length) return 0;
  let totalEquipped = 0;
  let totalRequired = 0;

  for (const cam of cameras) {
    const d = cam.currentDetections;
    const equipped = d.helmetsOk + d.vestsOk + d.gogglesOk;
    const missing = d.helmetsMissing + d.vestsMissing + d.gogglesMissing;
    totalEquipped += equipped;
    totalRequired += equipped + missing;
  }

  if (totalRequired === 0) return 100;
  return Math.round((totalEquipped / totalRequired) * 100);
}

/**
 * Evaluates emission status for an environmental sensor reading
 */
export function evaluateEcoSensorStatus(
  value: number,
  thresholdWarning: number,
  thresholdCritical: number
): EcoStatus {
  if (value >= thresholdCritical) return 'critical';
  if (value >= thresholdWarning) return 'warning';
  return 'normal';
}

/**
 * Evaluates machine health status and Remaining Useful Life (RUL)
 * based on ISO 10816 vibration standards and thermal deviation
 */
export function evaluateMachineHealth(
  tempC: number,
  tempBase: number,
  vibMmS: number,
  vibBase: number
): {
  riskStatus: MachineRiskLevel;
  failureProbability: number;
  rulHours: number;
} {
  const tempDelta = Math.max(0, tempC - tempBase);
  const vibDelta = Math.max(0, vibMmS - vibBase);

  // ISO 10816-3 Group 1 rigid foundation criteria:
  // < 2.3 mm/s: Good (Class A)
  // 2.3 - 4.5 mm/s: Acceptable (Class B)
  // 4.5 - 7.1 mm/s: Unsatisfactory (Class C - Warning)
  // > 7.1 mm/s: Unacceptable (Class D - Critical)

  let failureProbability = 5;
  let riskStatus: MachineRiskLevel = 'low';
  let rulHours = 1200;

  if (vibMmS > 7.1 || tempDelta > 28) {
    riskStatus = 'critical';
    failureProbability = Math.min(98, Math.round(75 + vibDelta * 4 + tempDelta * 0.7));
    rulHours = Math.max(12, Math.round(96 - vibDelta * 10));
  } else if (vibMmS > 4.5 || tempDelta > 16) {
    riskStatus = 'high';
    failureProbability = Math.min(74, Math.round(45 + vibDelta * 5 + tempDelta * 0.8));
    rulHours = Math.max(72, Math.round(320 - vibDelta * 25));
  } else if (vibMmS > 2.8 || tempDelta > 8) {
    riskStatus = 'medium';
    failureProbability = Math.min(44, Math.round(20 + vibDelta * 6 + tempDelta * 0.6));
    rulHours = Math.round(650 - vibDelta * 40);
  } else {
    riskStatus = 'low';
    failureProbability = Math.max(2, Math.round(5 + (vibMmS / 2.8) * 10));
    rulHours = 1200 + Math.round((2.8 - vibMmS) * 100);
  }

  return { riskStatus, failureProbability, rulHours };
}

/**
 * Filter generic time logs
 */
export function isTimestampInFilter(timestampStr: string, filter: TimeFilter, nowMs: number = Date.now()): boolean {
  const ts = new Date(timestampStr).getTime();
  if (isNaN(ts)) return true; // Keep fallback mock items
  const deltaHours = (nowMs - ts) / (1000 * 60 * 60);

  switch (filter) {
    case '1h':
      return deltaHours <= 1.0;
    case '8h':
      return deltaHours <= 8.0;
    case '24h':
      return deltaHours <= 24.0;
    case '7d':
      return deltaHours <= 168.0;
    default:
      return true;
  }
}

/**
 * Filter SafeVision violations
 */
export function filterPpeViolations(
  violations: PPEViolation[],
  areaFilter: string,
  statusFilter: string,
  timeFilter: TimeFilter,
  nowMs: number = Date.now()
): PPEViolation[] {
  return violations.filter((v) => {
    if (areaFilter !== 'all' && v.area !== areaFilter) return false;
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    return isTimestampInFilter(v.timestamp, timeFilter, nowMs);
  });
}

/**
 * Filter Eco deviations
 */
export function filterEcoReadings(
  readings: EcoReadingEvent[],
  areaFilter: string,
  statusFilter: string,
  timeFilter: TimeFilter,
  nowMs: number = Date.now()
): EcoReadingEvent[] {
  return readings.filter((r) => {
    if (areaFilter !== 'all' && r.area !== areaFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return isTimestampInFilter(r.time, timeFilter, nowMs);
  });
}

/**
 * Filter Machines by area and risk status
 */
export function filterMachines(
  machines: IndustrialMachine[],
  areaFilter: string,
  riskFilter: string
): IndustrialMachine[] {
  return machines.filter((m) => {
    if (areaFilter !== 'all' && m.area !== areaFilter) return false;
    if (riskFilter !== 'all' && m.riskStatus !== riskFilter) return false;
    return true;
  });
}

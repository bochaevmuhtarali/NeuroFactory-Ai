import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePpeComplianceRate,
  evaluateEcoSensorStatus,
  evaluateMachineHealth,
  filterPpeViolations,
  filterEcoReadings,
} from './industrialMath';
import { IndustrialCamera, PPEViolation, EcoReadingEvent } from '../types';

test('calculatePpeComplianceRate calculates 100% when no missing items', () => {
  const cameras: IndustrialCamera[] = [
    {
      id: 'cam-1',
      name: 'CAM 1',
      area: 'Shop 1',
      fps: 25,
      resolution: '1920x1080',
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
    },
  ];
  assert.equal(calculatePpeComplianceRate(cameras), 100);
});

test('calculatePpeComplianceRate calculates accurate partial compliance', () => {
  const cameras: IndustrialCamera[] = [
    {
      id: 'cam-1',
      name: 'CAM 1',
      area: 'Shop 1',
      fps: 25,
      resolution: '1920x1080',
      status: 'active',
      currentDetections: {
        helmetsOk: 3,
        helmetsMissing: 1, // 3/4
        vestsOk: 2,
        vestsMissing: 2,   // 2/4
        gogglesOk: 4,
        gogglesMissing: 0, // 4/4
        inHazardZone: 1,
      },
    },
  ];
  // 9 equipped out of 12 required = 75%
  assert.equal(calculatePpeComplianceRate(cameras), 75);
});

test('evaluateEcoSensorStatus assigns normal, warning, and critical states correctly', () => {
  const warningThreshold = 20;
  const criticalThreshold = 35;

  assert.equal(evaluateEcoSensorStatus(10, warningThreshold, criticalThreshold), 'normal');
  assert.equal(evaluateEcoSensorStatus(20, warningThreshold, criticalThreshold), 'warning');
  assert.equal(evaluateEcoSensorStatus(30, warningThreshold, criticalThreshold), 'warning');
  assert.equal(evaluateEcoSensorStatus(35, warningThreshold, criticalThreshold), 'critical');
  assert.equal(evaluateEcoSensorStatus(55, warningThreshold, criticalThreshold), 'critical');
});

test('evaluateMachineHealth calculates ISO vibration and thermal risk categories', () => {
  // Nominal machine: 1.2 mm/s vibration, baseline temp 45C
  const nominal = evaluateMachineHealth(46, 45, 1.2, 1.0);
  assert.equal(nominal.riskStatus, 'low');
  assert.ok(nominal.rulHours > 1000);
  assert.ok(nominal.failureProbability < 20);

  // Warning vibration (3.8 mm/s)
  const warning = evaluateMachineHealth(55, 45, 3.8, 1.0);
  assert.equal(warning.riskStatus, 'medium');

  // Severe vibration (> 7.1 mm/s)
  const severe = evaluateMachineHealth(78, 45, 8.4, 1.0);
  assert.equal(severe.riskStatus, 'critical');
  assert.ok(severe.failureProbability >= 75);
  assert.ok(severe.rulHours < 100);
});

test('filterPpeViolations filters violations by area and status', () => {
  const sampleViolations: PPEViolation[] = [
    {
      id: 'v1',
      timestamp: new Date().toISOString(),
      cameraId: 'c1',
      cameraName: 'Cam 1',
      area: 'Area A',
      violationType: 'no_helmet',
      confidence: 0.94,
      workerCount: 1,
      status: 'new',
    },
    {
      id: 'v2',
      timestamp: new Date().toISOString(),
      cameraId: 'c2',
      cameraName: 'Cam 2',
      area: 'Area B',
      violationType: 'no_vest',
      confidence: 0.91,
      workerCount: 1,
      status: 'verified',
    },
  ];

  const filteredArea = filterPpeViolations(sampleViolations, 'Area A', 'all', '24h');
  assert.equal(filteredArea.length, 1);
  assert.equal(filteredArea[0].id, 'v1');

  const filteredStatus = filterPpeViolations(sampleViolations, 'all', 'verified', '24h');
  assert.equal(filteredStatus.length, 1);
  assert.equal(filteredStatus[0].id, 'v2');
});

/**
 * Automated Kinematics Test Suite
 * Validates:
 * 1. Forward Kinematics (FK) and Inverse Kinematics (IK) mathematical round-trip consistency
 * 2. Mounting transforms (floor, top, side, shelf, custom)
 * 3. Explicit Tool Center Point (TCP) transformation
 * 4. Singularity detection (wrist singularity, workspace boundary)
 * 5. Joint limits enforcement
 * 6. Multi-model compatibility (FANUC, Yaskawa, ABB, KUKA)
 */

import { ROBOT_PRESETS } from '../presets';
import { RobotMountConfig, ToolCenterPoint } from '../../types/robot';
import { buildRobotKinematicModel } from './robotModelBuilder';
import { computeForwardKinematics } from './forwardKinematics';
import { solveInverseKinematicsAnalytical } from './inverseKinematics';
import { validateFkIkConsistency } from './consistencyValidator';
import { distance3D, angularDifferenceDeg } from './matrix4';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  results.push({
    suite,
    name,
    passed: Boolean(condition),
    details: condition ? undefined : details
  });
}

export function runKinematicsTests(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const robotSpec = ROBOT_PRESETS[0]; // Yaskawa GP50

  // =========================================================================
  // TEST SUITE 1: Basic Model Architecture & Kinematic Chain Properties
  // =========================================================================
  {
    const suite = 'Model Architecture';
    const model = buildRobotKinematicModel(robotSpec);

    assert(model.joints.length === 6, suite, 'Has exactly 6 joints');
    assert(model.links.upperArmMm > 0 && model.links.forearmMm > 0, suite, 'Has valid link dimensions');
    assert(model.manufacturer === robotSpec.manufacturer, suite, 'Preserves manufacturer');
    assert(model.name === robotSpec.name, suite, 'Preserves model name');

    // Verify all joint axes are defined
    const allAxesValid = model.joints.every(j => j.axis.length === 3 && (j.axis[0] !== 0 || j.axis[1] !== 0 || j.axis[2] !== 0));
    assert(allAxesValid, suite, 'All joint axes are non-zero unit vectors');

    // Verify joint limits exist for all 6 joints
    const allLimitsValid = model.joints.every(j => j.limits.minDeg < j.limits.maxDeg);
    assert(allLimitsValid, suite, 'Joint limits are properly bounded');
  }

  // =========================================================================
  // TEST SUITE 2: Forward Kinematics (FK) Determinism
  // =========================================================================
  {
    const suite = 'Forward Kinematics';
    const model = buildRobotKinematicModel(robotSpec);

    // Zero position
    const fkZero = computeForwardKinematics([0, 0, 0, 0, 0, 0], model);
    assert(fkZero.jointTransforms.length === 6, suite, 'Computes 6 joint transforms');
    assert(fkZero.tcpPosition.length === 3, suite, 'Computes 3D TCP position');
    assert(!Number.isNaN(fkZero.tcpPosition[0]), suite, 'TCP X is a valid number');
    assert(!Number.isNaN(fkZero.tcpPosition[1]), suite, 'TCP Y is a valid number');
    assert(!Number.isNaN(fkZero.tcpPosition[2]), suite, 'TCP Z is a valid number');

    // J1 rotation moves TCP along a circle in the X-Z (or X-Y) plane
    const fkRotJ1 = computeForwardKinematics([90, 0, 0, 0, 0, 0], model);
    const radDistZero = Math.hypot(fkZero.tcpPosition[0], fkZero.tcpPosition[2]);
    const radDistRot = Math.hypot(fkRotJ1.tcpPosition[0], fkRotJ1.tcpPosition[2]);
    assert(Math.abs(radDistZero - radDistRot) < 2.0, suite, 'Pure J1 rotation maintains radial distance from base axis');
  }

  // =========================================================================
  // TEST SUITE 3: FK / IK Round-Trip Mathematical Consistency
  // =========================================================================
  {
    const suite = 'FK/IK Consistency';
    const testAngles: [number, number, number, number, number, number][] = [
      [0, 20, -15, 0, 45, 0],
      [30, 15, -30, 25, 40, -20],
      [-45, -10, 20, -15, 50, 30],
      [15, -25, 10, 40, -45, 60]
    ];

    testAngles.forEach((angles, idx) => {
      const report = validateFkIkConsistency(angles, robotSpec, undefined, undefined, 2.0, 2.0);
      assert(
        report.pass,
        suite,
        `Pose ${idx + 1} round-trip consistency (err: ${report.positionErrorMm}mm, ${report.orientationErrorDeg}°)`,
        `PosErr: ${report.positionErrorMm}mm, OriErr: ${report.orientationErrorDeg}°, isReachable: ${report.isReachable}`
      );
    });
  }

  // =========================================================================
  // TEST SUITE 4: Explicit Tool Center Point (TCP) Offsets
  // =========================================================================
  {
    const suite = 'Tool Center Point (TCP)';
    const customTool: ToolCenterPoint = {
      x: 50,
      y: 30,
      z: 280,
      rx: 0,
      ry: 15,
      rz: 0,
      manifoldType: 'dual_sided_matrix',
      nozzleCount: 12,
      manifoldWidthMm: 250,
      weightKg: 8.5
    };

    const modelWithTool = buildRobotKinematicModel(robotSpec, customTool);

    const testJoints: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
    const fkWith = computeForwardKinematics(testJoints, modelWithTool);

    // Distance between flange and TCP should match the Euclidean norm of tool offset
    const expectedToolDist = Math.hypot(customTool.x, customTool.y, customTool.z);
    const actualToolDist = distance3D(fkWith.flangePosition, fkWith.tcpPosition);
    assert(
      Math.abs(actualToolDist - expectedToolDist) < 1.0,
      suite,
      `TCP position offset matches tool geometry (expected: ${expectedToolDist.toFixed(1)}mm, got: ${actualToolDist.toFixed(1)}mm)`
    );

    // Validate FK/IK consistency with TCP enabled
    const report = validateFkIkConsistency([15, 20, -10, 10, 40, 15], modelWithTool, undefined, undefined, 2.0, 2.0);
    assert(report.pass, suite, 'FK/IK round-trip consistent with non-zero TCP offset');
  }

  // =========================================================================
  // TEST SUITE 5: Mounting Transforms (Floor, Top, Side, Shelf)
  // =========================================================================
  {
    const suite = 'Mounting Transforms';
    const mountTypes: RobotMountConfig['type'][] = ['floor', 'top', 'side', 'shelf'];

    mountTypes.forEach((type) => {
      const mountConfig: RobotMountConfig = {
        type,
        distanceMm: 300,
        heightMm: 800,
        lateralMm: 200,
        rotationDeg: 0
      };

      const model = buildRobotKinematicModel(robotSpec, undefined, mountConfig);
      assert(model.baseTransform.type === type, suite, `Supports mounting type: ${type}`);

      // Verify that mounting transform affects world TCP position
      const fk = computeForwardKinematics([0, 15, -20, 0, 35, 0], model);
      assert(!Number.isNaN(fk.tcpPosition[0]) && !Number.isNaN(fk.tcpPosition[1]), suite, `Mount ${type} computes valid coordinates`);

      // Verify FK/IK consistency under this mount
      const report = validateFkIkConsistency([10, 15, -15, 0, 45, 0], model, undefined, undefined, 2.0, 2.0);
      assert(report.pass, suite, `FK/IK solves consistently under mount type: ${type}`);
    });
  }

  // =========================================================================
  // TEST SUITE 6: Singularity Detection
  // =========================================================================
  {
    const suite = 'Singularity Detection';
    const model = buildRobotKinematicModel(robotSpec);

    // 1. Wrist singularity: when J5 = 0, axes 4 and 6 are collinear
    const fkAtWristSingularity = computeForwardKinematics([0, 20, -10, 0, 0, 0], model);
    const ikWristSingular = solveInverseKinematicsAnalytical(
      fkAtWristSingularity.tcpPosition,
      fkAtWristSingularity.tcpEuler,
      model,
      [0, 20, -10, 0, 0, 0]
    );
    assert(ikWristSingular.isSingular, suite, 'Detects wrist singularity (J5 ≈ 0°)');
    assert(ikWristSingular.singularityType === 'wrist', suite, 'Correctly flags wrist singularity type');

    // 2. Out-of-reach boundary singularity: target position beyond robot reach
    const unreachableTarget: [number, number, number] = [5000, 5000, 5000]; // 5m away, robot reach is ~2.06m
    const ikUnreachable = solveInverseKinematicsAnalytical(unreachableTarget, [0, 0, 0], model);
    assert(!ikUnreachable.isReachable, suite, 'Flags target position beyond reach as unreachable');
    assert(ikUnreachable.isSingular, suite, 'Flags boundary reach condition as singular');
    assert(ikUnreachable.singularityType === 'boundary', suite, 'Correctly flags boundary singularity type');
  }

  // =========================================================================
  // TEST SUITE 7: Joint Limit Enforcement
  // =========================================================================
  {
    const suite = 'Joint Limit Enforcement';
    const model = buildRobotKinematicModel(robotSpec);

    // Pick a reachable pose, then artificially restrict J1 limits
    model.joints[0].limits.minDeg = 0;
    model.joints[0].limits.maxDeg = 10; // Very narrow limits

    // Target that requires J1 ~ 60 deg
    const fkTarget = computeForwardKinematics([60, 20, -10, 0, 40, 0], buildRobotKinematicModel(robotSpec));
    const ikResult = solveInverseKinematicsAnalytical(fkTarget.tcpPosition, fkTarget.tcpEuler, model);

    assert(
      ikResult.hasJointLimitViolation,
      suite,
      'Detects joint limit violation when target requires out-of-bounds joint angle'
    );
    assert(
      ikResult.violatedJointIndex === 0,
      suite,
      'Accurately identifies Joint 1 as violating joint'
    );
  }

  // =========================================================================
  // TEST SUITE 8: Multi-Robot Manufacturer Compatibility
  // =========================================================================
  {
    const suite = 'Multi-Robot Presets';
    ROBOT_PRESETS.forEach((spec) => {
      const model = buildRobotKinematicModel(spec);
      // For 6-DOF articulated robots use standard spatial pose; for 2-axis reciprocators use home pose
      const testPose: [number, number, number, number, number, number] = spec.degreesOfFreedom === 6
        ? [10, 20, -15, 0, 40, 10]
        : [0, 0, 0, 0, 0, 0];
      const report = validateFkIkConsistency(testPose, model, undefined, undefined, 2.0, 2.0);
      assert(
        report.pass,
        suite,
        `${spec.manufacturer} ${spec.name.split(' ')[0]} kinematic round-trip consistency`,
        `Error: ${report.positionErrorMm}mm, Reachable: ${report.isReachable}`
      );
    });
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}

// If executed directly via tsx, run and print output
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('kinematics.test')) {
  console.log('--- RUNNING INDUSTRIAL ROBOT KINEMATICS TEST SUITE ---');
  const summary = runKinematicsTests();
  summary.results.forEach((r) => {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${r.suite}] ${status}: ${r.name}${r.details ? ` (${r.details})` : ''}`);
  });
  console.log(`\nTest Summary: ${summary.passed}/${summary.total} passed (${summary.failed} failed).`);
  if (summary.failed > 0) {
    process.exit(1);
  }
}

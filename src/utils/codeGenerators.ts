import { Waypoint } from '../types/path';
import { RobotManufacturer } from '../types/robot';

export function generateRobotCode(
  waypoints: Waypoint[],
  manufacturer: RobotManufacturer,
  programName: string = 'DIE_SPRAY_V1'
): { filename: string; language: string; code: string } {
  switch (manufacturer) {
    case 'FANUC':
      return generateFanucCode(waypoints, programName);
    case 'ABB':
      return generateAbbRapidCode(waypoints, programName);
    case 'KUKA':
      return generateKukaKrlCode(waypoints, programName);
    case 'YASKAWA':
      return generateYaskawaInformCode(waypoints, programName);
    case 'LINEAR_RECIPROCATOR':
    default:
      return generateLinearReciprocatorCode(waypoints, programName);
  }
}

function generateFanucCode(waypoints: Waypoint[], programName: string) {
  const lines: string[] = [];
  lines.push(`/PROG  ${programName}`);
  lines.push(`/ATTR`);
  lines.push(`OWNER       = DIE_CAST_CELL;`);
  lines.push(`COMMENT     = "SPRAY ROBOT TRAJECTORY";`);
  lines.push(`PROG_SIZE   = ${waypoints.length * 128};`);
  lines.push(`CREATE      = DATE 2026-09-14  TIME 08:00:00;`);
  lines.push(`DEFAULT_GROUP = 1,*,*,*,*;`);
  lines.push(`/APPL`);
  lines.push(`/MN`);
  lines.push(`   1:  ! ==================================== ;`);
  lines.push(`   2:  ! DIE SPRAY ROBOT TRAJECTORY PROGRAM ;`);
  lines.push(`   3:  ! FANUC R-30iB Plus Controller       ;`);
  lines.push(`   4:  ! ==================================== ;`);
  lines.push(`   5:  UFRAME_NUM=1 ;`);
  lines.push(`   6:  UTOOL_NUM=2 ;`);
  lines.push(`   7:  DO[1:LubeValve]=OFF ;`);
  lines.push(`   8:  DO[2:AirBlowValve]=OFF ;`);
  lines.push(`   9:  WAIT DI[10:DieFullOpen]=ON ;`);

  let lineNum = 10;

  waypoints.forEach((wp, idx) => {
    const pIdx = idx + 1;
    const term = wp.blendRadius > 0 ? `CNT${Math.min(100, Math.round(wp.blendRadius * 2))}` : 'FINE';
    const moveCmd = wp.motionType === 'JOINT' ? 'J' : 'L';
    const speedStr = wp.motionType === 'JOINT' ? `${Math.min(100, Math.round(wp.speed / 15))}%` : `${Math.round(wp.speed)}mm/sec`;

    lines.push(`  ${lineNum++}:  ! Step ${pIdx}: ${wp.name} ;`);

    // Output valves
    if (wp.action === 'LUBE_SPRAY') {
      lines.push(`  ${lineNum++}:  DO[1:LubeValve]=ON ;`);
      lines.push(`  ${lineNum++}:  DO[2:AirBlowValve]=OFF ;`);
      lines.push(`  ${lineNum++}:  AO[1:FlowRateProp]=${Math.round(wp.flowRateMlPerSec * 10)} ;`);
    } else if (wp.action === 'AIR_BLOW') {
      lines.push(`  ${lineNum++}:  DO[1:LubeValve]=OFF ;`);
      lines.push(`  ${lineNum++}:  DO[2:AirBlowValve]=ON ;`);
    } else if (wp.action === 'LUBE_AND_AIR') {
      lines.push(`  ${lineNum++}:  DO[1:LubeValve]=ON ;`);
      lines.push(`  ${lineNum++}:  DO[2:AirBlowValve]=ON ;`);
      lines.push(`  ${lineNum++}:  AO[1:FlowRateProp]=${Math.round(wp.flowRateMlPerSec * 10)} ;`);
    } else {
      lines.push(`  ${lineNum++}:  DO[1:LubeValve]=OFF ;`);
      lines.push(`  ${lineNum++}:  DO[2:AirBlowValve]=OFF ;`);
    }

    lines.push(`  ${lineNum++}:  ${moveCmd} P[${pIdx}] ${speedStr} ${term} ;`);

    if (wp.dwellTimeSec > 0) {
      lines.push(`  ${lineNum++}:  WAIT  ${wp.dwellTimeSec.toFixed(2)}(sec) ;`);
    }
  });

  lines.push(`  ${lineNum++}:  DO[1:LubeValve]=OFF ;`);
  lines.push(`  ${lineNum++}:  DO[2:AirBlowValve]=OFF ;`);
  lines.push(`  ${lineNum++}:  DO[5:SprayCycleComplete]=ON ;`);
  lines.push(`  ${lineNum++}:  PULSE DO[5:SprayCycleComplete] 0.50(sec) ;`);
  lines.push(`/POS`);

  waypoints.forEach((wp, idx) => {
    const pIdx = idx + 1;
    lines.push(`P[${pIdx}]{`);
    lines.push(`   GP1:`);
    lines.push(`	UF : 1, UT : 2,	CONFIG : 'N U T, 0, 0, 0',`);
    lines.push(`	X =  ${wp.x.toFixed(2)}  mm,	Y =  ${wp.y.toFixed(2)}  mm,	Z =  ${wp.z.toFixed(2)}  mm,`);
    lines.push(`	W =  ${wp.rx.toFixed(2)} deg,	P =  ${wp.ry.toFixed(2)} deg,	R =  ${wp.rz.toFixed(2)} deg`);
    lines.push(`};`);
  });

  lines.push(`/END`);

  return {
    filename: `${programName}.LS`,
    language: 'fanuc-tp',
    code: lines.join('\n')
  };
}

function generateAbbRapidCode(waypoints: Waypoint[], programName: string) {
  const lines: string[] = [];
  lines.push(`MODULE ${programName}`);
  lines.push(`  ! ABB RAPID Code - IRC5 / OmniCore Controller`);
  lines.push(`  ! Foundry Plus Die Spray Process`);
  lines.push(``);
  lines.push(`  PERS tooldata tSprayManifold := [TRUE, [[0,0,220],[1,0,0,0]], [14.5, [0,0,100], [1,0,0,0], 0, 0, 0]];`);
  lines.push(`  PERS wobjdata wobj_DCM_Cell := [FALSE, TRUE, "", [[0,0,0],[1,0,0,0]], [[0,0,0],[1,0,0,0]]];`);
  lines.push(``);

  // Targets
  waypoints.forEach((wp, idx) => {
    const pName = `p_${idx + 1}`;
    lines.push(`  CONST robtarget ${pName} := [[${wp.x.toFixed(1)}, ${wp.y.toFixed(1)}, ${wp.z.toFixed(1)}], [1,0,0,0], [0,0,0,0], [9E9,9E9,9E9,9E9,9E9,9E9]];`);
  });

  lines.push(``);
  lines.push(`  PROC main()`);
  lines.push(`    WaitDI di_DCM_DieOpen, 1;`);
  lines.push(`    Reset do_SprayLube;`);
  lines.push(`    Reset do_AirBlow;`);
  lines.push(``);

  waypoints.forEach((wp, idx) => {
    const pName = `p_${idx + 1}`;
    const vSpeed = `v${Math.min(2000, Math.max(100, Math.round(wp.speed / 100) * 100))}`;
    const zZone = wp.blendRadius > 20 ? 'z50' : wp.blendRadius > 0 ? 'z10' : 'fine';
    const moveCmd = wp.motionType === 'JOINT' ? 'MoveJ' : 'MoveL';

    if (wp.action === 'LUBE_SPRAY' || wp.action === 'LUBE_AND_AIR') {
      lines.push(`    SetDO do_SprayLube, 1;`);
    } else {
      lines.push(`    SetDO do_SprayLube, 0;`);
    }

    if (wp.action === 'AIR_BLOW' || wp.action === 'LUBE_AND_AIR') {
      lines.push(`    SetDO do_AirBlow, 1;`);
    } else {
      lines.push(`    SetDO do_AirBlow, 0;`);
    }

    lines.push(`    ${moveCmd} ${pName}, ${vSpeed}, ${zZone}, tSprayManifold\\WObj:=wobj_DCM_Cell;`);

    if (wp.dwellTimeSec > 0) {
      lines.push(`    WaitTime ${wp.dwellTimeSec.toFixed(2)};`);
    }
  });

  lines.push(``);
  lines.push(`    SetDO do_SprayLube, 0;`);
  lines.push(`    SetDO do_AirBlow, 0;`);
  lines.push(`    PulseDO \\PLength:=0.5, do_SprayPermitDieClose;`);
  lines.push(`  ENDPROC`);
  lines.push(`ENDMODULE`);

  return {
    filename: `${programName}.mod`,
    language: 'abb-rapid',
    code: lines.join('\n')
  };
}

function generateKukaKrlCode(waypoints: Waypoint[], programName: string) {
  const lines: string[] = [];
  lines.push(`&ACCESS RVP`);
  lines.push(`&REL 1`);
  lines.push(`&PARAM TEMPLATE = C:\\KRC\\Roboter\\Template\\vorgabe`);
  lines.push(`&PARAM EDITMASK = *`);
  lines.push(`DEF ${programName}()`);
  lines.push(`  ; KUKA Robot Language (KRL) - KRC4 Controller`);
  lines.push(`  ; FOLD INI`);
  lines.push(`    BAS (#INITMOV, 0)`);
  lines.push(`  ; ENDFOLD`);
  lines.push(``);
  lines.push(`  $BASE = $NULLFRAME`);
  lines.push(`  $TOOL = {FRAME: X 0.0, Y 0.0, Z 220.0, A 0.0, B 0.0, C 0.0}`);
  lines.push(`  $OUT[1] = FALSE ; Lube Valve`);
  lines.push(`  $OUT[2] = FALSE ; Blow Air`);
  lines.push(`  WAIT FOR $IN[10] == TRUE ; Die Fully Open`);
  lines.push(``);

  waypoints.forEach((wp, idx) => {
    const moveCmd = wp.motionType === 'JOINT' ? 'PTP' : 'LIN';
    const velPercent = Math.min(100, Math.round(wp.speed / 20));

    if (wp.motionType === 'JOINT') {
      lines.push(`  $VEL.CP = ${velPercent}`);
    } else {
      lines.push(`  $VEL.CP = ${(wp.speed / 1000).toFixed(2)} ; m/s`);
    }

    if (wp.action === 'LUBE_SPRAY' || wp.action === 'LUBE_AND_AIR') {
      lines.push(`  $OUT[1] = TRUE`);
    } else {
      lines.push(`  $OUT[1] = FALSE`);
    }

    if (wp.action === 'AIR_BLOW' || wp.action === 'LUBE_AND_AIR') {
      lines.push(`  $OUT[2] = TRUE`);
    } else {
      lines.push(`  $OUT[2] = FALSE`);
    }

    lines.push(`  ${moveCmd} {X ${wp.x.toFixed(1)}, Y ${wp.y.toFixed(1)}, Z ${wp.z.toFixed(1)}, A ${wp.rx.toFixed(1)}, B ${wp.ry.toFixed(1)}, C ${wp.rz.toFixed(1)}} ${wp.blendRadius > 0 ? 'C_DIS' : ''}`);

    if (wp.dwellTimeSec > 0) {
      lines.push(`  WAIT SEC ${wp.dwellTimeSec.toFixed(2)}`);
    }
  });

  lines.push(`  $OUT[1] = FALSE`);
  lines.push(`  $OUT[2] = FALSE`);
  lines.push(`  PULSE($OUT[5], TRUE, 0.5) ; Die Close Interlock Release`);
  lines.push(`END`);

  return {
    filename: `${programName}.src`,
    language: 'kuka-krl',
    code: lines.join('\n')
  };
}

function generateYaskawaInformCode(waypoints: Waypoint[], programName: string) {
  const lines: string[] = [];
  lines.push(`/JOB`);
  lines.push(`//NAME ${programName}`);
  lines.push(`//POS`);
  lines.push(`///NPOS ${waypoints.length},0,0,0,0,0`);
  lines.push(`///TOOL 1`);

  waypoints.forEach((wp, idx) => {
    lines.push(`C000${idx < 9 ? '0' + (idx + 1) : (idx + 1)}=${wp.x.toFixed(2)},${wp.y.toFixed(2)},${wp.z.toFixed(2)},${wp.rx.toFixed(2)},${wp.ry.toFixed(2)},${wp.rz.toFixed(2)}`);
  });

  lines.push(`//INST`);
  lines.push(`///DATE 2026/09/14 08:00`);
  lines.push(`///ATTR SC,RO`);
  lines.push(`NOP`);
  lines.push(`WAIT IN#(10)=ON`);
  lines.push(`DOUT OT#(1) OFF`);
  lines.push(`DOUT OT#(2) OFF`);

  waypoints.forEach((wp, idx) => {
    const pStr = `C000${idx < 9 ? '0' + (idx + 1) : (idx + 1)}`;
    const moveCmd = wp.motionType === 'JOINT' ? `MOVJ ${pStr} VJ=75.00` : `MOVL ${pStr} V=${Math.round(wp.speed)}`;

    if (wp.action === 'LUBE_SPRAY' || wp.action === 'LUBE_AND_AIR') {
      lines.push(`DOUT OT#(1) ON`);
    } else {
      lines.push(`DOUT OT#(1) OFF`);
    }

    if (wp.action === 'AIR_BLOW' || wp.action === 'LUBE_AND_AIR') {
      lines.push(`DOUT OT#(2) ON`);
    } else {
      lines.push(`DOUT OT#(2) OFF`);
    }

    lines.push(moveCmd);

    if (wp.dwellTimeSec > 0) {
      lines.push(`TIMER T=${wp.dwellTimeSec.toFixed(2)}`);
    }
  });

  lines.push(`DOUT OT#(1) OFF`);
  lines.push(`DOUT OT#(2) OFF`);
  lines.push(`PULSE OT#(5) T=0.50`);
  lines.push(`END`);

  return {
    filename: `${programName}.JBI`,
    language: 'yaskawa-inform',
    code: lines.join('\n')
  };
}

function generateLinearReciprocatorCode(waypoints: Waypoint[], programName: string) {
  const lines: string[] = [];
  lines.push(`; WOLLIN / RIMROCK RECIPROCATOR G-CODE / STEP TABLE`);
  lines.push(`; PROGRAM: ${programName}`);
  lines.push(`; AXIS X = HORIZONTAL STROKE, AXIS Y = VERTICAL DIP`);
  lines.push(`G90 G21 ; Absolute coordinates in mm`);
  lines.push(`M101 ; Wait for DCM Die Open Signal`);

  waypoints.forEach((wp, idx) => {
    lines.push(`; --- Step ${idx + 1}: ${wp.name} ---`);
    if (wp.action === 'LUBE_SPRAY' || wp.action === 'LUBE_AND_AIR') {
      lines.push(`M08 ; Turn Lube Spray ON`);
    } else {
      lines.push(`M09 ; Turn Lube Spray OFF`);
    }

    if (wp.action === 'AIR_BLOW' || wp.action === 'LUBE_AND_AIR') {
      lines.push(`M07 ; Turn Air Blow ON`);
    } else {
      lines.push(`M06 ; Turn Air Blow OFF`);
    }

    lines.push(`G01 X${wp.x.toFixed(1)} Y${wp.y.toFixed(1)} Z${wp.z.toFixed(1)} F${Math.round(wp.speed * 60)}`);

    if (wp.dwellTimeSec > 0) {
      lines.push(`G04 P${Math.round(wp.dwellTimeSec * 1000)} ; Dwell ms`);
    }
  });

  lines.push(`M09 ; Lube OFF`);
  lines.push(`M06 ; Air OFF`);
  lines.push(`M102 ; Signal DCM Die Close Ready`);
  lines.push(`M30 ; End of program`);

  return {
    filename: `${programName}.nc`,
    language: 'gcode',
    code: lines.join('\n')
  };
}

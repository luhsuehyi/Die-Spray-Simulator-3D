import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';

export const CellPlan2DFallback: React.FC = () => {
  const {
    language,
    machine,
    die,
    robot,
    waypoints,
    selectedWaypointId,
    setSelectedWaypointId,
    activeWaypointIndex,
    currentRobotPose
  } = useSimulationStore();

  const t = translations[language] || translations['en'];

  // Dimensions & SVG coordinate scaling
  // Cell coordinate range: X from -1500 to 1500, Z from -1800 to 1800
  const svgWidth = 800;
  const svgHeight = 600;
  const scale = 0.22; // px per mm
  const originX = 400;
  const originY = 300;

  const toSvg = (xMm: number, zMm: number) => ({
    x: originX + xMm * scale,
    y: originY + zMm * scale
  });

  const [tcpX, , tcpZ] = currentRobotPose.tcpPositionMm;
  const robotSvg = toSvg(robot.baseOffset[0], robot.baseOffset[2]);
  const tcpSvg = toSvg(tcpX, tcpZ);

  const fixedPlatenSvg = toSvg(0, die.fixedDieOffsetZ - 120);
  const movablePlatenSvg = toSvg(0, die.movableDieOffsetZ + 120);

  const halfH = machine.tieBarClearanceH / 2;
  const tbRadius = (machine.tieBarDiameter / 2) * scale;

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 relative select-none">
      {/* Blueprint Grid & Header */}
      <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700/60 rounded p-2 text-xs font-mono text-slate-300 shadow">
        <div className="text-blue-400 font-bold">2D CELL TOP-DOWN ENGINEERING BLUEPRINT</div>
        <div className="text-slate-400 text-[11px]">DCM: {machine.name} | Robot: {robot.name}</div>
        <div className="text-slate-400 text-[11px]">Tie-Bar Clearance: {machine.tieBarClearanceH}mm x {machine.tieBarClearanceV}mm</div>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full max-w-4xl max-h-[700px] border border-slate-800 bg-slate-900/60 rounded-xl shadow-2xl"
      >
        {/* Engineering Grid */}
        <defs>
          <pattern id="grid2d" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid2d)" />

        {/* Center Crosshairs */}
        <line x1={originX} y1={0} x2={originX} y2={svgHeight} stroke="#334155" strokeDasharray="4,4" />
        <line x1={0} y1={originY} x2={svgWidth} y2={originY} stroke="#334155" strokeDasharray="4,4" />

        {/* Robot Reach Envelope (Circle) */}
        <circle
          cx={robotSvg.x}
          cy={robotSvg.y}
          r={robot.reachMm * scale}
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeDasharray="6,6"
          opacity="0.4"
        />

        {/* DCM Bed Rails */}
        <rect
          x={originX - (machine.platenWidth * 0.45) * scale}
          y={originY - 900 * scale}
          width={(machine.platenWidth * 0.9) * scale}
          height={1800 * scale}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Fixed Platen (Top side in Z) */}
        <rect
          x={originX - (machine.platenWidth / 2) * scale}
          y={fixedPlatenSvg.y - 40 * scale}
          width={machine.platenWidth * scale}
          height={100 * scale}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="2"
        />
        <text
          x={originX}
          y={fixedPlatenSvg.y - 10}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          fontFamily="monospace"
        >
          FIXED PLATEN (STATIONARY)
        </text>

        {/* Fixed Die Block */}
        <rect
          x={originX - (die.dimensions.width / 2) * scale}
          y={originY + die.fixedDieOffsetZ * scale}
          width={die.dimensions.width * scale}
          height={die.dimensions.depth * scale}
          fill="#334155"
          stroke="#0284c7"
          strokeWidth="1.5"
        />

        {/* Movable Platen */}
        <rect
          x={originX - (machine.platenWidth / 2) * scale}
          y={movablePlatenSvg.y}
          width={machine.platenWidth * scale}
          height={100 * scale}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="2"
        />
        <text
          x={originX}
          y={movablePlatenSvg.y + 40}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          fontFamily="monospace"
        >
          MOVABLE PLATEN (STROKE: {machine.maxDieOpeningStroke}mm)
        </text>

        {/* Movable Die Block */}
        <rect
          x={originX - (die.dimensions.width / 2) * scale}
          y={originY + (die.movableDieOffsetZ - die.dimensions.depth) * scale}
          width={die.dimensions.width * scale}
          height={die.dimensions.depth * scale}
          fill="#334155"
          stroke="#0284c7"
          strokeWidth="1.5"
        />

        {/* Tie Bars (Top-down circles) */}
        {[-halfH, halfH].map((tbX, idx) => (
          <g key={idx}>
            <circle
              cx={originX + tbX * scale}
              cy={originY - 800 * scale}
              r={tbRadius}
              fill="#cbd5e1"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <circle
              cx={originX + tbX * scale}
              cy={originY + 800 * scale}
              r={tbRadius}
              fill="#cbd5e1"
              stroke="#0f172a"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* Robot Base */}
        <circle
          cx={robotSvg.x}
          cy={robotSvg.y}
          r={28}
          fill="#f59e0b"
          stroke="#b45309"
          strokeWidth="3"
        />
        <text
          x={robotSvg.x}
          y={robotSvg.y + 42}
          textAnchor="middle"
          fill="#f59e0b"
          fontSize="10"
          fontFamily="monospace"
        >
          ROBOT BASE
        </text>

        {/* Robot Arm Links line to TCP */}
        <line
          x1={robotSvg.x}
          y1={robotSvg.y}
          x2={tcpSvg.x}
          y2={tcpSvg.y}
          stroke="#f59e0b"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* TCP Tool Marker */}
        <circle
          cx={tcpSvg.x}
          cy={tcpSvg.y}
          r={12}
          fill="#38bdf8"
          stroke="#0369a1"
          strokeWidth="2"
        />

        {/* Trajectory Polyline */}
        {waypoints.length > 1 && (
          <polyline
            points={waypoints.map(wp => `${toSvg(wp.x, wp.z).x},${toSvg(wp.x, wp.z).y}`).join(' ')}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        )}

        {/* Waypoints nodes */}
        {waypoints.map((wp, idx) => {
          const pt = toSvg(wp.x, wp.z);
          const isSel = wp.id === selectedWaypointId;
          const isAct = idx === activeWaypointIndex;

          return (
            <g
              key={wp.id}
              className="cursor-pointer"
              onClick={() => setSelectedWaypointId(wp.id)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSel || isAct ? 8 : 5}
                fill={isAct ? '#10b981' : isSel ? '#f59e0b' : '#38bdf8'}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <text
                x={pt.x + 8}
                y={pt.y - 6}
                fill={isSel ? '#f59e0b' : '#94a3b8'}
                fontSize="9"
                fontFamily="monospace"
              >
                P{idx + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

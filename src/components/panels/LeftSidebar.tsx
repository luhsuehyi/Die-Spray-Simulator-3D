import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Droplets,
  Wind,
  Navigation,
  Move3d,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';
import { MotionType, SprayActionType, TargetDieFace } from '../../types/path';

export const LeftSidebar: React.FC = () => {
  const {
    language,
    waypoints,
    selectedWaypointId,
    setSelectedWaypointId,
    addWaypoint,
    updateWaypoint,
    deleteWaypoint,
    activeWaypointIndex
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const [jogStepMm, setJogStepMm] = useState<number>(20);
  const [jogTab, setJogTab] = useState<'points' | 'jog'>('points');
  const [isParamsCollapsed, setIsParamsCollapsed] = useState(false);

  const selectedWp = waypoints.find(w => w.id === selectedWaypointId) || waypoints[0];

  const handleJog = (axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz', delta: number) => {
    if (!selectedWp) return;
    updateWaypoint(selectedWp.id, {
      [axis]: Math.round((selectedWp[axis] + delta) * 10) / 10
    });
  };

  return (
    <aside className="w-72 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0 text-slate-200 select-none text-xs">
      {/* 1. Header Segmented Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950/70 p-1">
        <button
          id="tab-waypoints-list-btn"
          onClick={() => setJogTab('points')}
          className={`flex-1 py-1 text-[11px] font-semibold rounded transition flex items-center justify-center gap-1.5 cursor-pointer ${
            jogTab === 'points'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3 h-3" />
          <span>Sequencer ({waypoints.length})</span>
        </button>
        <button
          id="tab-jog-teach-btn"
          onClick={() => setJogTab('jog')}
          className={`flex-1 py-1 text-[11px] font-semibold rounded transition flex items-center justify-center gap-1.5 cursor-pointer ${
            jogTab === 'jog'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Move3d className="w-3 h-3" />
          <span>Teach Jog</span>
        </button>
      </div>

      {jogTab === 'points' ? (
        <>
          {/* Waypoint Toolbar */}
          <div className="px-2.5 py-1.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
            <button
              id="add-waypoint-btn"
              onClick={() => addWaypoint()}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Add Point</span>
            </button>
            <div className="flex items-center gap-0.5">
              <button
                id="clone-waypoint-btn"
                onClick={() => selectedWp && addWaypoint({ ...selectedWp, id: undefined, name: `${selectedWp.name} (Copy)` })}
                title={t.duplicateWaypoint}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                id="delete-waypoint-btn"
                disabled={waypoints.length <= 2}
                onClick={() => selectedWp && deleteWaypoint(selectedWp.id)}
                title={t.deleteWaypoint}
                className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition disabled:opacity-20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Precision Waypoints List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-1.5 space-y-0.5">
            {waypoints.map((wp, idx) => {
              const isSelected = wp.id === selectedWaypointId;
              const isActive = idx === activeWaypointIndex;

              return (
                <div
                  key={wp.id}
                  id={`waypoint-item-${idx}`}
                  onClick={() => setSelectedWaypointId(wp.id)}
                  className={`p-1.5 rounded transition flex items-center justify-between gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-950/50 border-blue-500/80 text-white'
                      : isActive
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-900/40 border-transparent hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-4 h-4 rounded text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-[11px] font-medium leading-tight truncate">{wp.name}</div>
                      <div className="text-[9.5px] text-slate-400 font-mono leading-tight mt-0.5">
                        {Math.round(wp.x)},{Math.round(wp.y)},{Math.round(wp.z)} | {wp.speed}mm/s
                      </div>
                    </div>
                  </div>

                  {/* Action Badges */}
                  <div className="shrink-0 flex items-center gap-1">
                    {wp.action === 'LUBE_SPRAY' && (
                      <span className="px-1 py-0.5 bg-blue-950 text-blue-400 border border-blue-800/80 rounded text-[9px] font-mono" title="Lube Spray">
                        LUBE
                      </span>
                    )}
                    {wp.action === 'AIR_BLOW' && (
                      <span className="px-1 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/80 rounded text-[9px] font-mono" title="Air Blow">
                        AIR
                      </span>
                    )}
                    {wp.action === 'LUBE_AND_AIR' && (
                      <span className="px-1 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/80 rounded text-[9px] font-mono" title="Dual Spray">
                        DUAL
                      </span>
                    )}
                    {wp.action === 'NONE' && (
                      <span className="text-[9px] font-mono text-slate-500 px-1">
                        TR
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Waypoint Property Editor */}
          {selectedWp && (
            <div className="border-t border-slate-800 bg-slate-950/80 text-xs">
              <div
                onClick={() => setIsParamsCollapsed(!isParamsCollapsed)}
                className="px-2.5 py-1.5 flex items-center justify-between font-semibold text-slate-300 cursor-pointer hover:bg-slate-900/50 border-b border-slate-800/60"
              >
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  Parameters (P{selectedWp.index + 1})
                </span>
                {isParamsCollapsed ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
              </div>

              {!isParamsCollapsed && (
                <div className="p-2.5 space-y-2 max-h-64 overflow-y-auto">
                  {/* Name input */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">POINT NAME</label>
                    <input
                      type="text"
                      value={selectedWp.name}
                      onChange={e => updateWaypoint(selectedWp.id, { name: e.target.value })}
                      className="w-full mt-0.5 bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Motion Type & Target Face */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono">MOTION</label>
                      <select
                        value={selectedWp.motionType}
                        onChange={e => updateWaypoint(selectedWp.id, { motionType: e.target.value as MotionType })}
                        className="w-full mt-0.5 bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-slate-200"
                      >
                        <option value="LINEAR">LINEAR (MoveL)</option>
                        <option value="JOINT">JOINT (MoveJ)</option>
                        <option value="SPLINE">SPLINE (Curve)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono">TARGET DIE</label>
                      <select
                        value={selectedWp.targetFace}
                        onChange={e => updateWaypoint(selectedWp.id, { targetFace: e.target.value as TargetDieFace })}
                        className="w-full mt-0.5 bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-slate-200"
                      >
                        <option value="FIXED_DIE">Fixed Die (Cover)</option>
                        <option value="MOVABLE_DIE">Moving Die (Core)</option>
                        <option value="BOTH">Both Halves</option>
                        <option value="TRANSIT">Transit Clear</option>
                      </select>
                    </div>
                  </div>

                  {/* Spray Action */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">PROCESS ACTION</label>
                    <select
                      value={selectedWp.action}
                      onChange={e => updateWaypoint(selectedWp.id, { action: e.target.value as SprayActionType })}
                      className="w-full mt-0.5 bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-slate-200"
                    >
                      <option value="NONE">NONE (Dry Transit)</option>
                      <option value="LUBE_SPRAY">LUBE_SPRAY (Release Agent)</option>
                      <option value="AIR_BLOW">AIR_BLOW (Drying / Purge)</option>
                      <option value="LUBE_AND_AIR">LUBE_AND_AIR (Dual Atomize)</option>
                    </select>
                  </div>

                  {/* Feed Speed & Dwell Time */}
                  <div className="grid grid-cols-2 gap-1.5 font-mono">
                    <div>
                      <label className="text-[10px] text-slate-400">SPEED (mm/s)</label>
                      <input
                        type="number"
                        min="20"
                        max="2000"
                        step="50"
                        value={selectedWp.speed}
                        onChange={e => updateWaypoint(selectedWp.id, { speed: Number(e.target.value) })}
                        className="w-full mt-0.5 bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">DWELL (s)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={selectedWp.dwellTimeSec}
                        onChange={e => updateWaypoint(selectedWp.id, { dwellTimeSec: Number(e.target.value) })}
                        className="w-full mt-0.5 bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Flow Rate & Blend Radius */}
                  <div className="grid grid-cols-2 gap-1.5 font-mono">
                    <div>
                      <label className="text-[10px] text-slate-400">FLOW (ml/s)</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        step="5"
                        value={selectedWp.flowRateMlPerSec}
                        onChange={e => updateWaypoint(selectedWp.id, { flowRateMlPerSec: Number(e.target.value) })}
                        className="w-full mt-0.5 bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">BLEND (mm)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={selectedWp.blendRadius}
                        onChange={e => updateWaypoint(selectedWp.id, { blendRadius: Number(e.target.value) })}
                        className="w-full mt-0.5 bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Teach Pendant Virtual Jogging Controls */
        <div className="p-3 space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="text-[11px] text-slate-300 font-mono pb-1 border-b border-slate-800">
            Pendant Target: <strong className="text-cyan-400">{selectedWp?.name}</strong>
          </div>

          {/* Jog Step Increment Buttons */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase">Step Increment</label>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {[5, 20, 50, 100].map(step => (
                <button
                  key={step}
                  onClick={() => setJogStepMm(step)}
                  className={`py-1 text-[11px] font-mono rounded border transition cursor-pointer ${
                    jogStepMm === step
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {step}mm
                </button>
              ))}
            </div>
          </div>

          {/* Translation Cartesian Jog (X, Y, Z) */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Cartesian Translation</div>
            <div className="grid grid-cols-3 gap-1.5">
              {/* X Axis */}
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 mb-1">X: {Math.round(selectedWp?.x || 0)}</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('x', -jogStepMm)}
                    className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded font-mono font-bold text-slate-300 cursor-pointer"
                  >
                    -X
                  </button>
                  <button
                    onClick={() => handleJog('x', jogStepMm)}
                    className="w-7 h-7 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono font-bold cursor-pointer"
                  >
                    +X
                  </button>
                </div>
              </div>

              {/* Y Axis */}
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 mb-1">Y: {Math.round(selectedWp?.y || 0)}</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('y', -jogStepMm)}
                    className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded font-mono font-bold text-slate-300 cursor-pointer"
                  >
                    -Y
                  </button>
                  <button
                    onClick={() => handleJog('y', jogStepMm)}
                    className="w-7 h-7 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono font-bold cursor-pointer"
                  >
                    +Y
                  </button>
                </div>
              </div>

              {/* Z Axis */}
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 mb-1">Z: {Math.round(selectedWp?.z || 0)}</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('z', -jogStepMm)}
                    className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded font-mono font-bold text-slate-300 cursor-pointer"
                  >
                    -Z
                  </button>
                  <button
                    onClick={() => handleJog('z', jogStepMm)}
                    className="w-7 h-7 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono font-bold cursor-pointer"
                  >
                    +Z
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tool Orientation Jog (Rx, Ry, Rz) */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tool Orientation Angles</div>
            <div className="grid grid-cols-3 gap-1.5">
              {/* Rx Pitch */}
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 mb-1">Rx: {Math.round(selectedWp?.rx || 0)}°</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('rx', -10)}
                    className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded font-mono font-bold text-slate-300 cursor-pointer text-[10px]"
                  >
                    -Rx
                  </button>
                  <button
                    onClick={() => handleJog('rx', 10)}
                    className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono font-bold cursor-pointer text-[10px]"
                  >
                    +Rx
                  </button>
                </div>
              </div>

              {/* Ry Roll */}
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 mb-1">Ry: {Math.round(selectedWp?.ry || 0)}°</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('ry', -10)}
                    className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded font-mono font-bold text-slate-300 cursor-pointer text-[10px]"
                  >
                    -Ry
                  </button>
                  <button
                    onClick={() => handleJog('ry', 10)}
                    className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono font-bold cursor-pointer text-[10px]"
                  >
                    +Ry
                  </button>
                </div>
              </div>

              {/* Rz Yaw */}
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                <div className="text-[10px] font-mono text-slate-400 mb-1">Rz: {Math.round(selectedWp?.rz || 0)}°</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('rz', -10)}
                    className="w-7 h-7 bg-slate-850 hover:bg-slate-800 rounded font-mono font-bold text-slate-300 cursor-pointer text-[10px]"
                  >
                    -Rz
                  </button>
                  <button
                    onClick={() => handleJog('rz', 10)}
                    className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono font-bold cursor-pointer text-[10px]"
                  >
                    +Rz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Droplets,
  Wind,
  Navigation,
  Move3d,
  ChevronDown,
  ChevronRight,
  Sliders,
  Settings2
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';
import { Waypoint, MotionType, SprayActionType, TargetDieFace } from '../../types/path';

export const LeftSidebar: React.FC = () => {
  const {
    language,
    waypoints,
    selectedWaypointId,
    setSelectedWaypointId,
    addWaypoint,
    updateWaypoint,
    deleteWaypoint,
    reorderWaypoints,
    activeWaypointIndex
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const [jogStepMm, setJogStepMm] = useState<number>(20);
  const [jogTab, setJogTab] = useState<'points' | 'jog'>('points');

  const selectedWp = waypoints.find(w => w.id === selectedWaypointId) || waypoints[0];

  const handleJog = (axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz', delta: number) => {
    if (!selectedWp) return;
    updateWaypoint(selectedWp.id, {
      [axis]: Math.round((selectedWp[axis] + delta) * 10) / 10
    });
  };

  return (
    <aside className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0 text-slate-200 select-none">
      {/* Sidebar Header Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
        <button
          id="tab-waypoints-list-btn"
          onClick={() => setJogTab('points')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded transition flex items-center justify-center gap-1.5 ${
            jogTab === 'points'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          {t.waypointSequencer} ({waypoints.length})
        </button>
        <button
          id="tab-jog-teach-btn"
          onClick={() => setJogTab('jog')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded transition flex items-center justify-center gap-1.5 ${
            jogTab === 'jog'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Move3d className="w-3.5 h-3.5" />
          Teach Jog
        </button>
      </div>

      {jogTab === 'points' ? (
        <>
          {/* Action Toolbar */}
          <div className="p-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <button
              id="add-waypoint-btn"
              onClick={() => addWaypoint()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.addWaypoint}
            </button>
            <div className="flex items-center gap-1">
              <button
                id="clone-waypoint-btn"
                onClick={() => selectedWp && addWaypoint({ ...selectedWp, id: undefined, name: `${selectedWp.name} (Copy)` })}
                title={t.duplicateWaypoint}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                id="delete-waypoint-btn"
                disabled={waypoints.length <= 2}
                onClick={() => selectedWp && deleteWaypoint(selectedWp.id)}
                title={t.deleteWaypoint}
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Waypoints List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {waypoints.map((wp, idx) => {
              const isSelected = wp.id === selectedWaypointId;
              const isActive = idx === activeWaypointIndex;

              return (
                <div
                  key={wp.id}
                  id={`waypoint-item-${idx}`}
                  onClick={() => setSelectedWaypointId(wp.id)}
                  className={`p-2 rounded-lg cursor-pointer transition flex items-center justify-between gap-2 border ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/80 shadow'
                      : isActive
                      ? 'bg-emerald-950/30 border-emerald-500/60'
                      : 'bg-slate-800/40 border-transparent hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                      isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-medium text-slate-200 truncate">{wp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        X:{Math.round(wp.x)} Y:{Math.round(wp.y)} Z:{Math.round(wp.z)} | {wp.speed} mm/s
                      </div>
                    </div>
                  </div>

                  {/* Action Badges */}
                  <div className="flex items-center gap-1 shrink-0">
                    {wp.action === 'LUBE_SPRAY' && (
                      <span className="p-1 bg-blue-500/20 text-blue-400 rounded" title="Lube Spray">
                        <Droplets className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {wp.action === 'AIR_BLOW' && (
                      <span className="p-1 bg-cyan-500/20 text-cyan-300 rounded" title="Air Blow">
                        <Wind className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {wp.action === 'LUBE_AND_AIR' && (
                      <span className="p-1 bg-indigo-500/20 text-indigo-300 rounded flex gap-0.5" title="Lube + Air Dual">
                        <Droplets className="w-3 h-3" />
                        <Wind className="w-3 h-3" />
                      </span>
                    )}
                    {wp.action === 'NONE' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                        Transit
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Waypoint Property Editor */}
          {selectedWp && (
            <div className="border-t border-slate-800 p-3 bg-slate-950/70 space-y-2.5 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Waypoint Parameters
                </span>
                <span className="text-[10px] text-blue-400 font-mono">#{selectedWp.index + 1}</span>
              </div>

              {/* Name input */}
              <div>
                <label className="text-[10px] text-slate-400 font-medium">Name / Description</label>
                <input
                  type="text"
                  value={selectedWp.name}
                  onChange={e => updateWaypoint(selectedWp.id, { name: e.target.value })}
                  className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Motion Type & Target Face */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">{t.motionType}</label>
                  <select
                    value={selectedWp.motionType}
                    onChange={e => updateWaypoint(selectedWp.id, { motionType: e.target.value as MotionType })}
                    className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="LINEAR">LINEAR (MoveL)</option>
                    <option value="JOINT">JOINT (MoveJ)</option>
                    <option value="SPLINE">SPLINE (Curve)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">{t.targetFace}</label>
                  <select
                    value={selectedWp.targetFace}
                    onChange={e => updateWaypoint(selectedWp.id, { targetFace: e.target.value as TargetDieFace })}
                    className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="FIXED_DIE">{t.fixedDie}</option>
                    <option value="MOVABLE_DIE">{t.movableDie}</option>
                    <option value="BOTH">{t.bothDies}</option>
                    <option value="TRANSIT">{t.transit}</option>
                  </select>
                </div>
              </div>

              {/* Spray Action */}
              <div>
                <label className="text-[10px] text-slate-400 font-medium">{t.action}</label>
                <select
                  value={selectedWp.action}
                  onChange={e => updateWaypoint(selectedWp.id, { action: e.target.value as SprayActionType })}
                  className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="NONE">NONE (Dry Transit)</option>
                  <option value="LUBE_SPRAY">LUBE_SPRAY (Release Agent)</option>
                  <option value="AIR_BLOW">AIR_BLOW (Drying / Cleaning)</option>
                  <option value="LUBE_AND_AIR">LUBE_AND_AIR (Dual Atomize)</option>
                </select>
              </div>

              {/* Feed Speed & Dwell Time */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">{t.feedSpeed} (mm/s)</label>
                  <input
                    type="number"
                    min="20"
                    max="2000"
                    step="50"
                    value={selectedWp.speed}
                    onChange={e => updateWaypoint(selectedWp.id, { speed: Number(e.target.value) })}
                    className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">{t.dwellTime} (sec)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={selectedWp.dwellTimeSec}
                    onChange={e => updateWaypoint(selectedWp.id, { dwellTimeSec: Number(e.target.value) })}
                    className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Flow Rate & Blend Radius */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">{t.flowRate} (ml/s)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="5"
                    value={selectedWp.flowRateMlPerSec}
                    onChange={e => updateWaypoint(selectedWp.id, { flowRateMlPerSec: Number(e.target.value) })}
                    className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">{t.blendRadius} (mm)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedWp.blendRadius}
                    onChange={e => updateWaypoint(selectedWp.id, { blendRadius: Number(e.target.value) })}
                    className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Teach Pendant Virtual Jogging Controls */
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="text-xs text-slate-300 font-medium border-b border-slate-800 pb-2">
            Selected Point: <span className="text-blue-400 font-bold">{selectedWp?.name}</span>
          </div>

          {/* Jog Step Increment Buttons */}
          <div>
            <label className="text-[10px] text-slate-400 font-medium">Jog Step Distance</label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {[5, 20, 50, 100].map(step => (
                <button
                  key={step}
                  onClick={() => setJogStepMm(step)}
                  className={`py-1 text-xs font-mono font-medium rounded transition ${
                    jogStepMm === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {step}mm
                </button>
              ))}
            </div>
          </div>

          {/* Translation Cartesian Jog (X, Y, Z) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Cartesian Translation (XYZ)</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* X Axis */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                <div className="text-[11px] font-mono text-slate-400 mb-1">X: {Math.round(selectedWp?.x || 0)}</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('x', -jogStepMm)}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded font-bold"
                  >
                    -X
                  </button>
                  <button
                    onClick={() => handleJog('x', jogStepMm)}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
                  >
                    +X
                  </button>
                </div>
              </div>

              {/* Y Axis */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                <div className="text-[11px] font-mono text-slate-400 mb-1">Y: {Math.round(selectedWp?.y || 0)}</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('y', -jogStepMm)}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded font-bold"
                  >
                    -Y
                  </button>
                  <button
                    onClick={() => handleJog('y', jogStepMm)}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
                  >
                    +Y
                  </button>
                </div>
              </div>

              {/* Z Axis */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                <div className="text-[11px] font-mono text-slate-400 mb-1">Z: {Math.round(selectedWp?.z || 0)}</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('z', -jogStepMm)}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded font-bold"
                  >
                    -Z
                  </button>
                  <button
                    onClick={() => handleJog('z', jogStepMm)}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
                  >
                    +Z
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tool Orientation Jog (Rx, Ry, Rz) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Tool Orientation (Euler Angles)</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* Rx Pitch */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                <div className="text-[11px] font-mono text-slate-400 mb-1">Rx: {Math.round(selectedWp?.rx || 0)}°</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('rx', -10)}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded font-bold text-[11px]"
                  >
                    -Rx
                  </button>
                  <button
                    onClick={() => handleJog('rx', 10)}
                    className="w-8 h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px]"
                  >
                    +Rx
                  </button>
                </div>
              </div>

              {/* Ry Roll */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                <div className="text-[11px] font-mono text-slate-400 mb-1">Ry: {Math.round(selectedWp?.ry || 0)}°</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('ry', -10)}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded font-bold text-[11px]"
                  >
                    -Ry
                  </button>
                  <button
                    onClick={() => handleJog('ry', 10)}
                    className="w-8 h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px]"
                  >
                    +Ry
                  </button>
                </div>
              </div>

              {/* Rz Yaw */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                <div className="text-[11px] font-mono text-slate-400 mb-1">Rz: {Math.round(selectedWp?.rz || 0)}°</div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleJog('rz', -10)}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded font-bold text-[11px]"
                  >
                    -Rz
                  </button>
                  <button
                    onClick={() => handleJog('rz', 10)}
                    className="w-8 h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px]"
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

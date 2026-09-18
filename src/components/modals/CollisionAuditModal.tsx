import React from 'react';
import { X, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Ruler } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';

export const CollisionAuditModal: React.FC = () => {
  const {
    language,
    isCollisionAuditOpen,
    setIsCollisionAuditOpen,
    collisionResult,
    robot,
    currentRobotPose,
    machine,
    waypoints
  } = useSimulationStore();

  const t = translations[language] || translations['en'];

  if (!isCollisionAuditOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              collisionResult.hasCollision
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.collisionAudit}</h2>
              <p className="text-xs text-slate-400">Automated Interference & Spatial Clearance Verification</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollisionAuditOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Status Overview Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 grid grid-cols-3 gap-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Overall Audit Status</div>
            <div className={`text-base font-bold mt-1 flex items-center gap-1.5 ${
              collisionResult.hasCollision
                ? 'text-rose-400'
                : collisionResult.minClearanceDistanceMm < 60
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {collisionResult.hasCollision ? (
                <>
                  <AlertOctagon className="w-4 h-4" />
                  COLLISION DETECTED
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  SAFE TO OPERATE
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Minimum Clearance Margin</div>
            <div className="text-base font-bold text-blue-400 font-mono mt-1 flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              {collisionResult.minClearanceDistanceMm} mm
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Interference Violations</div>
            <div className="text-base font-bold text-slate-200 font-mono mt-1">
              {collisionResult.totalInterferences} points
            </div>
          </div>
        </div>

        {/* Detailed Interference Table */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Spatial Interference Checks
            </h3>
            {collisionResult.collisionPairs.length === 0 ? (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                No physical collisions or clearance breaches detected along the trajectory.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Severity</th>
                      <th className="p-2.5">Component A</th>
                      <th className="p-2.5">Component B</th>
                      <th className="p-2.5">Waypoint</th>
                      <th className="p-2.5">Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {collisionResult.collisionPairs.map((pair, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pair.severity === 'danger'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {pair.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-200">{pair.partA}</td>
                        <td className="p-2.5 text-slate-300">{pair.partB}</td>
                        <td className="p-2.5 text-blue-400">P{pair.waypointIndex + 1}</td>
                        <td className="p-2.5 text-slate-200">{pair.clearanceMm} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Joint Limits Audit Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Robot Articulation Joint Angle Limits
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {robot.jointLimits.map((lim, idx) => {
                const angle = currentRobotPose.jointAnglesDeg[idx] || 0;
                const isOutOfBounds = angle < lim.minDeg || angle > lim.maxDeg;

                return (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Axis J{idx + 1}</span>
                      <span className={isOutOfBounds ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {isOutOfBounds ? 'LIMIT EXCEEDED' : 'NOMINAL'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-1">
                      {angle}°
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Range: [{lim.minDeg}° to {lim.maxDeg}°]
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={() => setIsCollisionAuditOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};

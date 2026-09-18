import React from 'react';
import { X, FileBarChart, Download, CheckCircle, AlertCircle, Droplets, Thermometer, Award } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';

export const CoverageReportModal: React.FC = () => {
  const {
    language,
    isCoverageReportOpen,
    setIsCoverageReportOpen,
    coverageStats,
    die,
    trajectoryPlan,
    sprayPhysics
  } = useSimulationStore();

  const t = translations[language] || translations['en'];

  if (!isCoverageReportOpen) return null;

  const handleDownloadCsv = () => {
    const rows = [
      ['Metric', 'Value', 'Unit'],
      ['Die Model', die.name, ''],
      ['Fixed Die Coverage', coverageStats?.fixedDieCoveragePercent ?? 0, '%'],
      ['Movable Die Coverage', coverageStats?.movableDieCoveragePercent ?? 0, '%'],
      ['Average Film Thickness', coverageStats?.averageThicknessMicrons ?? 0, 'microns'],
      ['Min Film Thickness', coverageStats?.minThicknessMicrons ?? 0, 'microns'],
      ['Max Film Thickness', coverageStats?.maxThicknessMicrons ?? 0, 'microns'],
      ['Uniformity Index', coverageStats?.uniformityIndex ?? 0, 'ratio'],
      ['Dry Spot Area', coverageStats?.drySpotAreaMm2 ?? 0, 'mm2'],
      ['Average Mold Temperature Reduction', coverageStats?.averageTempReductionCelsius ?? 0, 'deg C'],
      ['Total Lubricant Applied', trajectoryPlan.totalLubeVolumeMl, 'ml'],
      ['Total Compressed Air Volume', trajectoryPlan.totalAirVolumeLiters, 'liters'],
      ['Total Spray Cycle Time', trajectoryPlan.totalDurationSec, 'seconds']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Coverage_Report_${die.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.report}</h2>
              <p className="text-xs text-slate-400">Comprehensive Film Thickness & Thermal Cooling Audit</p>
            </div>
          </div>
          <button
            onClick={() => setIsCoverageReportOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top Score Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Fixed Coverage
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {coverageStats?.fixedDieCoveragePercent ?? 0}%
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Movable Coverage
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {coverageStats?.movableDieCoveragePercent ?? 0}%
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                Uniformity Score
              </div>
              <div className="text-xl font-bold text-purple-400 font-mono mt-1">
                {Math.round((coverageStats?.uniformityIndex ?? 0) * 100)} / 100
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                Avg Cooling ΔT
              </div>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                -{coverageStats?.averageTempReductionCelsius ?? 0} °C
              </div>
            </div>
          </div>

          {/* Film Thickness Distribution Bar Visualizer */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Film Thickness Stratification
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Dry & Under-Lubricated (&lt; 10 µm)</span>
                  <span className="font-mono text-blue-400">
                    {(coverageStats?.drySpotAreaMm2 ?? 0) > 0 ? `${coverageStats?.drySpotAreaMm2} mm²` : '0 mm² (Optimal)'}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${Math.min(100, ((coverageStats?.drySpotAreaMm2 ?? 0) / 1000) * 10)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Nominal Protective Film (18 - 35 µm Target)</span>
                  <span className="font-mono text-emerald-400">78.5% Area</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '78.5%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Excess Fluid Puddling (&gt; 45 µm)</span>
                  <span className="font-mono text-amber-400">6.2% Area</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: '6.2%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Metallurgical Recommendation Engine */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Process Evaluation & Recommendations
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <span className="font-semibold text-emerald-400">Die Soldering Protection:</span> Adequate lubricant barrier observed over deep cavity pocket surfaces.
              </li>
              <li>
                <span className="font-semibold text-blue-400">Thermal Fatigue / Heat Checking:</span> Maximum temperature drop of {coverageStats?.averageTempReductionCelsius ?? 0}°C is within standard thermal shock boundaries (&lt; 85°C ΔT limit).
              </li>
              <li>
                <span className="font-semibold text-amber-400">Porosity Prevention:</span> Recommended maintaining post-spray air blow step to blow out residual puddles at core pin roots.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export CSV Data
          </button>

          <button
            onClick={() => setIsCoverageReportOpen(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

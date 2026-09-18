import React, { useState, useMemo } from 'react';
import { X, Copy, Download, Check, Code2, Cpu } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';
import { RobotManufacturer } from '../../types/robot';
import { generateRobotCode } from '../../utils/codeGenerators';

export const CodeExportModal: React.FC = () => {
  const {
    language,
    isCodeExportOpen,
    setIsCodeExportOpen,
    waypoints,
    robot
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const [selectedManufacturer, setSelectedManufacturer] = useState<RobotManufacturer>(robot.manufacturer);
  const [programName, setProgramName] = useState<string>('DIE_SPRAY_PROG');
  const [copied, setCopied] = useState<boolean>(false);

  const codeData = useMemo(() => {
    return generateRobotCode(waypoints, selectedManufacturer, programName);
  }, [waypoints, selectedManufacturer, programName]);

  if (!isCodeExportOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([codeData.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = codeData.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.exportCode}</h2>
              <p className="text-xs text-slate-400">Generate Native Controller Robot Language Programs</p>
            </div>
          </div>
          <button
            onClick={() => setIsCodeExportOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Manufacturer Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['FANUC', 'ABB', 'KUKA', 'YASKAWA', 'LINEAR_RECIPROCATOR'] as RobotManufacturer[]).map(mfg => (
              <button
                key={mfg}
                id={`mfg-tab-${mfg}`}
                onClick={() => setSelectedManufacturer(mfg)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  selectedManufacturer === mfg
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mfg === 'LINEAR_RECIPROCATOR' ? 'RECIPROCATOR (G-CODE)' : mfg}
              </button>
            ))}
          </div>

          {/* Program Name Input */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Program Name:</span>
            <input
              type="text"
              value={programName}
              onChange={e => setProgramName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Code View with Syntax Highlighting Look */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre className="overflow-x-auto whitespace-pre">
            {codeData.code}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            File: <span className="text-blue-400 font-semibold">{codeData.filename}</span> ({waypoints.length} Waypoints)
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-robot-code-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Code'}
            </button>

            <button
              id="download-robot-code-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download {codeData.filename}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

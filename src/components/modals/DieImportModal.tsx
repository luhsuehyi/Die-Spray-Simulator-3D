import React, { useState, useRef } from 'react';
import { X, Upload, FileCheck, AlertCircle, Box, Check } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';
import { parseSTL, createCustomDieModel } from '../../utils/meshImporter';

export const DieImportModal: React.FC = () => {
  const {
    language,
    isImportDieOpen,
    setIsImportDieOpen,
    setDie,
    die
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    vertexCount: number;
    triangleCount: number;
    bounds: { width: number; height: number; depth: number };
    meshData: any;
  } | null>(null);
  const [unitScale, setUnitScale] = useState<number>(1.0); // 1 = mm, 25.4 = inches, 1000 = meters
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isImportDieOpen) return null;

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseSTL(buffer);
      setParsedData({
        vertexCount: result.vertexCount,
        triangleCount: result.triangleCount,
        bounds: {
          width: result.boundingBox.size[0] || 600,
          height: result.boundingBox.size[1] || 500,
          depth: result.boundingBox.size[2] || 200
        },
        meshData: result
      });
    } catch (err: any) {
      setErrorMsg('Failed to parse STL file: ' + (err.message || 'Unknown format'));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (!parsedData) return;
    const customDie = createCustomDieModel(fileName || 'Custom Die', parsedData.meshData);
    setDie(customDie);
    setIsImportDieOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.importCad}</h2>
              <p className="text-xs text-slate-400">Import Custom Die Geometry (ASCII or Binary STL)</p>
            </div>
          </div>
          <button
            onClick={() => setIsImportDieOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Dropzone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".stl,.obj"
              onChange={e => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
              className="hidden"
            />
            <Box className="w-10 h-10 text-blue-400 mb-1" />
            <div className="font-medium text-slate-200">
              Drag & Drop your Die CAD file here, or <span className="text-blue-400 underline">browse</span>
            </div>
            <div className="text-[11px] text-slate-500">Supports .STL (ASCII/Binary) and .OBJ</div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedData && (
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <FileCheck className="w-4 h-4" />
                <span>{fileName} loaded successfully</span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
                <div className="bg-slate-900 p-2 rounded">Triangles: {parsedData.triangleCount.toLocaleString()}</div>
                <div className="bg-slate-900 p-2 rounded">Vertices: {parsedData.vertexCount.toLocaleString()}</div>
              </div>

              {/* Unit Scale Selector */}
              <div>
                <label className="text-slate-400 block mb-1">Mesh Unit Scaling</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Millimeters (1:1)', val: 1.0 },
                    { label: 'Inches (x25.4)', val: 25.4 },
                    { label: 'Meters (x1000)', val: 1000 }
                  ].map(unit => (
                    <button
                      key={unit.label}
                      type="button"
                      onClick={() => setUnitScale(unit.val)}
                      className={`p-1.5 rounded border text-center font-medium transition cursor-pointer ${
                        unitScale === unit.val
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Computed Size: {Math.round(parsedData.bounds.width * unitScale)} x {Math.round(parsedData.bounds.height * unitScale)} x {Math.round(parsedData.bounds.depth * unitScale)} mm
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={() => setIsImportDieOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Cancel
          </button>

          <button
            id="apply-imported-mesh-btn"
            disabled={!parsedData}
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-md disabled:opacity-40 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Apply to Simulation
          </button>
        </div>
      </div>
    </div>
  );
};

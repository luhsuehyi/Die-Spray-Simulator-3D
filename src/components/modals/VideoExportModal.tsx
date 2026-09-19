import React, { useState } from 'react';
import { X, Video, Camera, Download, Check, Play, Loader2, CheckCircle2 } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';
import {
  startDemoRecording,
  stopDemoRecording,
  RecorderProgress
} from '../../utils/videoRecorder';

export const VideoExportModal: React.FC = () => {
  const {
    language,
    isVideoExportOpen,
    setIsVideoExportOpen,
    setIsPlaying,
    resetSimulation
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [recorderProgress, setRecorderProgress] = useState<RecorderProgress>({
    state: 'idle',
    durationSec: 0,
    message: ''
  });

  if (!isVideoExportOpen) return null;

  const handleSnapshot = () => {
    const canvas = document.querySelector('#simulation-3d-canvas-container canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Die_Spray_Sim_Snapshot_${Date.now()}.png`;
    a.click();

    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2000);
  };

  const handleStartRecord = () => {
    const canvas = document.querySelector('#simulation-3d-canvas-container canvas') as HTMLCanvasElement;
    if (!canvas) return;

    resetSimulation();
    setIsPlaying(true);

    startDemoRecording(
      canvas,
      (p) => {
        setRecorderProgress(p);
      },
      12
    );
  };

  const handleStopRecord = () => {
    stopDemoRecording();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Media Export (H.264 MP4)</h2>
              <p className="text-xs text-slate-400">QuickTime & PowerPoint Compatible Video</p>
            </div>
          </div>
          <button
            onClick={() => setIsVideoExportOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Snapshot Button */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-400" />
                Viewport Snapshot
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">High-resolution PNG image download</div>
            </div>
            <button
              onClick={handleSnapshot}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition flex items-center gap-1 cursor-pointer"
            >
              {snapshotSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {snapshotSuccess ? 'Saved' : 'Capture PNG'}
            </button>
          </div>

          {/* Video Recording */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-rose-400" />
                  H.264 / AVC MP4 Video
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Universal compatibility (macOS QuickTime, Safari, Chrome, Windows, PPT)
                </div>
              </div>
            </div>

            {recorderProgress.state === 'recording' && (
              <div className="p-3 bg-rose-950/60 border border-rose-500 rounded text-center text-rose-300 animate-pulse font-medium flex items-center justify-between">
                <span>{recorderProgress.message}</span>
                <button
                  onClick={handleStopRecord}
                  className="px-2.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500"
                >
                  Stop Now
                </button>
              </div>
            )}

            {recorderProgress.state === 'rendering' && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded text-center text-amber-300 font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Rendering captured frames...</span>
              </div>
            )}

            {recorderProgress.state === 'encoding' && (
              <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded text-center text-blue-300 font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Encoding H.264 MP4 with ffmpeg...</span>
              </div>
            )}

            {recorderProgress.state === 'complete' && (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Export Complete: {recorderProgress.filename}</span>
                </div>
                {recorderProgress.downloadUrl && (
                  <a
                    href={recorderProgress.downloadUrl}
                    download={recorderProgress.filename || 'Tovonn_AI_Die_Spray_Demo.mp4'}
                    className="block w-full text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded"
                  >
                    Download H.264 MP4
                  </a>
                )}
                <button
                  onClick={handleStartRecord}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                >
                  Record Another Take
                </button>
              </div>
            )}

            {recorderProgress.state === 'idle' && (
              <button
                id="modal-start-record-btn"
                onClick={handleStartRecord}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                ● Record Demo (H.264 MP4)
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={() => setIsVideoExportOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Video, Camera, Download, Check, Play } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';

export const VideoExportModal: React.FC = () => {
  const {
    language,
    isVideoExportOpen,
    setIsVideoExportOpen,
    setIsPlaying,
    resetSimulation
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

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

    try {
      resetSimulation();
      setIsPlaying(true);
      setIsRecording(true);

      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setIsRecording(false);
      };

      mediaRecorder.start();

      // Record for 6 seconds or until loop
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 6000);
    } catch (e) {
      console.error('Recording error:', e);
      setIsRecording(false);
    }
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
              <h2 className="text-sm font-bold text-white">Media Export & Recording</h2>
              <p className="text-xs text-slate-400">Capture 3D Viewport Media & Training Records</p>
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
                  WebM Simulation Video
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">60fps digital twin recording for production SOPs</div>
              </div>
            </div>

            {isRecording ? (
              <div className="p-3 bg-rose-950/60 border border-rose-500 rounded text-center text-rose-300 animate-pulse font-medium">
                Recording 3D Simulation Stream (6s)...
              </div>
            ) : recordedBlobUrl ? (
              <div className="space-y-2">
                <video src={recordedBlobUrl} controls className="w-full rounded border border-slate-800 max-h-44" />
                <a
                  href={recordedBlobUrl}
                  download={`Die_Spray_Sim_${Date.now()}.webm`}
                  className="block w-full text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded"
                >
                  Download Recorded WebM
                </a>
              </div>
            ) : (
              <button
                onClick={handleStartRecord}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Start Recording Video
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

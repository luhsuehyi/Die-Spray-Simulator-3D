/**
 * Demo Video Recorder — native MediaRecorder + WebM (no server transcoder)
 * Captures the WebGL canvas via captureStream and downloads demo-recording.webm
 * on stop. Avoids blocking H.264/ffmpeg encoding that previously froze the UI.
 */

export type RecordingState =
  | 'idle'
  | 'recording'
  | 'rendering'
  | 'encoding'
  | 'complete'
  | 'error';

export interface RecorderProgress {
  state: RecordingState;
  durationSec: number;
  message: string;
  error?: string;
  downloadUrl?: string;
  filename?: string;
}

export type ProgressCallback = (progress: RecorderProgress) => void;

let activeMediaRecorder: MediaRecorder | null = null;
let recordingTimer: ReturnType<typeof setInterval> | null = null;
let startTime = 0;
let activeStream: MediaStream | null = null;

/** Prefer VP9, then VP8, then generic WebM. */
function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return '';
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a);
  }, 150);
}

function stopStreamTracks() {
  if (activeStream) {
    activeStream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    });
    activeStream = null;
  }
}

export async function checkFfmpegServerAvailable(): Promise<boolean> {
  // Kept for API compatibility; native path no longer depends on ffmpeg.
  return false;
}

export function startDemoRecording(
  canvas: HTMLCanvasElement,
  onProgress: ProgressCallback,
  maxDurationSec: number = 18
): () => void {
  stopDemoRecording();

  try {
    if (typeof canvas.captureStream !== 'function') {
      onProgress({
        state: 'error',
        durationSec: 0,
        message: 'Canvas captureStream is not supported in this browser',
        error: 'captureStream unavailable'
      });
      return () => {};
    }

    const stream = canvas.captureStream(30);
    activeStream = stream;

    const selectedMimeType = pickMimeType();
    const options: MediaRecorderOptions = selectedMimeType
      ? { mimeType: selectedMimeType, videoBitsPerSecond: 8_000_000 }
      : { videoBitsPerSecond: 8_000_000 };

    const mediaRecorder = new MediaRecorder(stream, options);
    activeMediaRecorder = mediaRecorder;
    const recordedChunks: Blob[] = [];

    startTime = Date.now();
    onProgress({
      state: 'recording',
      durationSec: 0,
      message: 'Recording canvas stream (WebM)…'
    });

    recordingTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      onProgress({
        state: 'recording',
        durationSec: Math.round(elapsed),
        message: `Recording… (${elapsed.toFixed(1)}s / ${maxDurationSec}s)`
      });
      if (elapsed >= maxDurationSec) {
        stopDemoRecording();
      }
    }, 250);

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = (ev) => {
      console.error('MediaRecorder error', ev);
      clearInterval(recordingTimer!);
      recordingTimer = null;
      stopStreamTracks();
      activeMediaRecorder = null;
      onProgress({
        state: 'error',
        durationSec: (Date.now() - startTime) / 1000,
        message: 'Recording failed',
        error: 'MediaRecorder error'
      });
    };

    mediaRecorder.onstop = () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
      }
      activeMediaRecorder = null;
      stopStreamTracks();

      const totalElapsed = (Date.now() - startTime) / 1000;

      if (recordedChunks.length === 0) {
        onProgress({
          state: 'error',
          durationSec: totalElapsed,
          message: 'No video data captured',
          error: 'empty chunks'
        });
        return;
      }

      // Assemble blob immediately — no server / no H.264 transcode
      const mime = selectedMimeType || 'video/webm';
      const blob = new Blob(recordedChunks, { type: mime });
      const downloadUrl = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `demo-recording-${dateStr}.webm`;

      triggerDownload(downloadUrl, filename);

      onProgress({
        state: 'complete',
        durationSec: totalElapsed,
        message: 'Export complete (WebM)',
        downloadUrl,
        filename
      });
    };

    // Timeslice so data is flushed periodically even on long recordings
    mediaRecorder.start(250);

    return () => {
      stopDemoRecording();
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'MediaRecorder initialization error';
    console.error('Failed to start recording:', err);
    stopStreamTracks();
    onProgress({
      state: 'error',
      durationSec: 0,
      message: 'Failed to record canvas stream',
      error: message
    });
    return () => {};
  }
}

export function stopDemoRecording() {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
  if (activeMediaRecorder && activeMediaRecorder.state === 'recording') {
    try {
      activeMediaRecorder.stop();
    } catch (e) {
      console.warn('stopDemoRecording:', e);
      stopStreamTracks();
      activeMediaRecorder = null;
    }
  } else {
    stopStreamTracks();
    activeMediaRecorder = null;
  }
}

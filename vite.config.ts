import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { defineConfig, Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = promisify(exec);

function mp4ExporterPlugin(): Plugin {
  const handler = (req: any, res: any) => {
    if (req.url === '/api/export-mp4/health') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok', ffmpeg: true }));
      return;
    }

    if (req.url === '/api/export-mp4' && req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const inputBuffer = Buffer.concat(chunks);
          if (inputBuffer.length === 0) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Empty video stream received' }));
            return;
          }

          const tempId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const inPath = path.join('/tmp', `${tempId}.webm`);
          const outPath = path.join('/tmp', `${tempId}.mp4`);

          await fs.promises.writeFile(inPath, inputBuffer);

          // Transcode to genuine standard H.264 / AVC MP4 with yuv420p and +faststart
          // Broadly compatible with macOS QuickTime, Safari, Windows, PowerPoint, and Premiere
          const ffmpegCmd = `ffmpeg -y -i "${inPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 -movflags +faststart "${outPath}"`;
          await execPromise(ffmpegCmd);

          const mp4Buffer = await fs.promises.readFile(outPath);

          // Clean up temp files asynchronously
          fs.unlink(inPath, () => {});
          fs.unlink(outPath, () => {});

          const dateStr = new Date().toISOString().split('T')[0];
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Content-Disposition', `attachment; filename="Tovonn_AI_Die_Spray_Demo_${dateStr}.mp4"`);
          res.setHeader('Content-Length', mp4Buffer.length);
          res.statusCode = 200;
          res.end(mp4Buffer);
        } catch (err: any) {
          console.error('[MP4 Exporter Plugin] Error transcoding video:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'FFmpeg transcode failed' }));
        }
      });
      return;
    }
  };

  return {
    name: 'mp4-exporter-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/export-mp4')) {
          handler(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/export-mp4')) {
          handler(req, res);
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), mp4ExporterPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

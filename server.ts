import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE_PATH = path.join(__dirname, 'shelfmedia_db.json');
const DB_TEMP_FILE_PATH = path.join(__dirname, 'shelfmedia_db.json.tmp');

interface SyncPayload {
  updatedAt: number;
  clientId?: string;
  [key: string]: unknown;
}

let memoryState: SyncPayload = { updatedAt: 0 };

function stripDangerousKeys(obj: unknown, depth = 0): unknown {
  if (depth > 8 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.slice(0, 25000).map((item) => stripDangerousKeys(item, depth + 1));
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    clean[key] = stripDangerousKeys(value, depth + 1);
  }
  return clean;
}

function isValidSyncPayload(data: unknown): data is SyncPayload {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const candidate = data as Record<string, unknown>;
  const ts = candidate.updatedAt;
  if (typeof ts !== 'number' || !Number.isFinite(ts) || ts < 0) return false;
  // Reject timestamps more than 24h in the future to prevent clock-skew poisoning
  if (ts > Date.now() + 86_400_000) return false;
  return true;
}

function loadStateFromDisk(): SyncPayload {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8').replace(/^\uFEFF/, '');
      const parsed = JSON.parse(raw);
      if (isValidSyncPayload(parsed)) {
        memoryState = stripDangerousKeys(parsed) as SyncPayload;
        return memoryState;
      }
    }
  } catch (err) {
    console.error('Failed to read shelfmedia_db.json:', err);
  }
  return memoryState;
}

function saveStateToDisk(state: SyncPayload): void {
  const sanitized = stripDangerousKeys(state) as SyncPayload;
  memoryState = sanitized;
  try {
    // Atomic write via temporary file + rename to prevent JSON corruption on crash/concurrent writes
    fs.writeFileSync(DB_TEMP_FILE_PATH, JSON.stringify(sanitized, null, 2), 'utf-8');
    fs.renameSync(DB_TEMP_FILE_PATH, DB_FILE_PATH);
  } catch (err) {
    console.error('Failed to write shelfmedia_db.json:', err);
  }
}

loadStateFromDisk();

function isAllowedOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return true; // Same-origin requests often omit Origin on GET
  try {
    const url = new URL(origin);
    if (
      url.hostname === '127.0.0.1' ||
      url.hostname === 'localhost' ||
      url.hostname.endsWith('.run.app')
    ) {
      return true;
    }
    if (host && url.host === host) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  // Security headers for all responses
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Increase JSON limit to support large media libraries
  app.use(express.json({ limit: '15mb' }));

  // Controlled CORS & Private Network Access headers for localhost / preview synchronization
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    const host = req.headers.host;

    if (!isAllowedOrigin(origin, host)) {
      res.status(403).json({ error: 'Forbidden origin' });
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Cache-Control');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Connected SSE clients for instant real-time push
  const sseClients = new Set<express.Response>();

  app.get('/api/sync/stream', (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.flushHeaders?.();

    // Send current state immediately on connect
    const current = loadStateFromDisk();
    res.write(`data: ${JSON.stringify(current)}\n\n`);

    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  app.get('/api/sync', (_req, res) => {
    const current = loadStateFromDisk();
    res.json(current);
  });

  app.post('/api/sync', (req, res) => {
    try {
      const incoming = req.body;
      if (!isValidSyncPayload(incoming)) {
        res.status(400).json({ error: 'Invalid sync payload' });
        return;
      }

      const current = loadStateFromDisk();
      if (incoming.updatedAt >= (current.updatedAt || 0)) {
        saveStateToDisk(incoming);

        // Broadcast sanitized state to all connected SSE clients
        const serialized = `data: ${JSON.stringify(memoryState)}\n\n`;
        for (const client of sseClients) {
          try {
            client.write(serialized);
          } catch {
            sseClients.delete(client);
          }
        }
      }

      res.json({
        ok: true,
        updatedAt: memoryState.updatedAt,
      });
    } catch (err) {
      console.error('Error in POST /api/sync:', err);
      res.status(500).json({ error: 'Internal sync error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShelfMedia Server & Sync API listening on http://localhost:${PORT} (http://127.0.0.1:${PORT})`);
  });
}

startServer();


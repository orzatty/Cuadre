import { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '../types';

export function corsMiddleware() {
  return cors({
    origin: (origin: string) => {
      // In development, allow all origins including Tauri (tauri://localhost)
      // In production, restrict to specific domains
      const allowedPatterns = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^tauri:\/\/localhost$/,
        /^https:\/\/.*\.cuadre\.app$/,
        /^https:\/\/cuadre\.app$/,
      ];

      if (!origin) return '*';

      for (const pattern of allowedPatterns) {
        if (pattern.test(origin)) return origin;
      }

      // In dev, allow everything
      return origin;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400,
  });
}

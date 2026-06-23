import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Always use .env.local values for these keys during local dev. */
const FORCE_LOCAL_ENV_KEYS = [
  'TAKBULL_API_KEY',
  'TAKBULL_API_SECRET',
  'TAKBULL_REDIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

const LOCAL_API_ROUTES: Record<string, () => Promise<{ default: (req: VercelRequest, res: VercelResponse) => Promise<unknown> }>> = {
  '/api/subscription': () => import('./api/subscription'),
  '/api/takbull/init-order': () => import('./api/takbull/init-order'),
  '/api/takbull/callback': () => import('./api/takbull/callback'),
  '/api/takbull/ipn': () => import('./api/takbull/ipn'),
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function createVercelResponse(nodeRes: ServerResponse): VercelResponse {
  let statusCode = 200;
  const res: VercelResponse = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      nodeRes.setHeader(name, value);
      return res;
    },
    json(obj: unknown) {
      if (!nodeRes.headersSent) {
        nodeRes.statusCode = statusCode;
        nodeRes.setHeader('Content-Type', 'application/json');
        nodeRes.end(JSON.stringify(obj));
      }
    },
    end(data?: string) {
      if (!nodeRes.headersSent) {
        nodeRes.statusCode = statusCode;
        nodeRes.end(data);
      }
    },
  } as VercelResponse;
  return res;
}

function applyLocalEnv(env: Record<string, string>) {
  for (const key of FORCE_LOCAL_ENV_KEYS) {
    if (env[key]) process.env[key] = env[key];
  }
  for (const [key, value] of Object.entries(env)) {
    if (value && !process.env[key]) process.env[key] = value;
  }
}

/** Run Vercel serverless handlers locally during `npm run start` (uses .env.local). */
export function localApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || '';
        const loadHandler = LOCAL_API_ROUTES[url];
        if (!loadHandler) return next();

        try {
          applyLocalEnv(env);

          let body: unknown;
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const raw = await readBody(req);
            body = raw ? JSON.parse(raw) : undefined;
          }

          const parsedUrl = new URL(req.url || '/', 'http://localhost');
          const vercelReq = {
            method: req.method,
            headers: req.headers,
            query: Object.fromEntries(parsedUrl.searchParams.entries()),
            body,
          } as VercelRequest;

          const { default: handler } = await loadHandler();
          await handler(vercelReq, createVercelResponse(res));
        } catch (error) {
          console.error(`Local ${url} error:`, error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'שגיאת שרת מקומי' }));
          }
        }
      });
    },
  };
}

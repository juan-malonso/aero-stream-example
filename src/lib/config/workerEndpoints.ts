export interface WorkerEndpointEnv {
  NODE_ENV?: string;
  NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN?: string;
  NEXT_PUBLIC_CONTROLLER_API_URL?: string;
  NEXT_PUBLIC_TOWER_API_URL?: string;
  NEXT_PUBLIC_TOWER_SYNC_URL?: string;
}

export interface WorkerEndpoints {
  controllerAdminToken: string;
  controllerApiUrl: string;
  towerApiUrl: string;
  towerSyncUrl: string;
}

export class WorkerEndpointConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerEndpointConfigError';
  }
}

const publicWorkerEnv: WorkerEndpointEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN: process.env.NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN,
  NEXT_PUBLIC_CONTROLLER_API_URL: process.env.NEXT_PUBLIC_CONTROLLER_API_URL,
  NEXT_PUBLIC_TOWER_API_URL: process.env.NEXT_PUBLIC_TOWER_API_URL,
  NEXT_PUBLIC_TOWER_SYNC_URL: process.env.NEXT_PUBLIC_TOWER_SYNC_URL,
};

const LOCAL_TEST_CONTROLLER_ADMIN_TOKEN = 'local-test-admin-token';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeUrl(name: keyof WorkerEndpointEnv, value: string | undefined, protocols: string[]): string {
  const raw = value?.trim();
  if (!raw) {
    throw new WorkerEndpointConfigError(`Missing ${name}. Configure ${name} for the example dual-worker integration.`);
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new WorkerEndpointConfigError(`Invalid ${name}. Expected an absolute URL, received "${raw}".`);
  }

  if (!protocols.includes(url.protocol)) {
    throw new WorkerEndpointConfigError(`Invalid ${name}. Expected protocol ${protocols.join(' or ')}, received "${url.protocol}".`);
  }

  return url.toString().replace(/\/$/, '');
}

function appendPath(baseUrl: string, path: string): string {
  const base = new URL(baseUrl);
  const basePath = base.pathname.replace(/\/$/, '');
  const nextPath = path.startsWith('/') ? path : `/${path}`;
  base.pathname = `${basePath}${nextPath}`;
  return base.toString().replace(/\/$/, '');
}

function deriveTowerSyncUrl(towerApiUrl: string): string {
  const url = new URL(appendPath(towerApiUrl, '/app/sync'));
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString().replace(/\/$/, '');
}

function requireValue(name: keyof WorkerEndpointEnv, value: string | undefined): string {
  const raw = value?.trim();
  if (!raw) {
    throw new WorkerEndpointConfigError(`Missing ${name}. Configure ${name} for the example dual-worker integration.`);
  }
  return raw;
}

function resolveControllerAdminToken(env: WorkerEndpointEnv, controllerApiUrl: string): string {
  const raw = env.NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN?.trim();
  if (raw) return raw;

  const { hostname } = new URL(controllerApiUrl);
  if (env.NODE_ENV !== 'production' && LOCAL_HOSTNAMES.has(hostname)) {
    return LOCAL_TEST_CONTROLLER_ADMIN_TOKEN;
  }

  return requireValue('NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN', env.NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN);
}

export function resolveWorkerEndpoints(env: WorkerEndpointEnv = publicWorkerEnv): WorkerEndpoints {
  const controllerApiUrl = normalizeUrl('NEXT_PUBLIC_CONTROLLER_API_URL', env.NEXT_PUBLIC_CONTROLLER_API_URL, ['http:', 'https:']);
  const towerApiUrl = normalizeUrl('NEXT_PUBLIC_TOWER_API_URL', env.NEXT_PUBLIC_TOWER_API_URL, ['http:', 'https:']);
  const controllerAdminToken = resolveControllerAdminToken(env, controllerApiUrl);
  const towerSyncUrl = env.NEXT_PUBLIC_TOWER_SYNC_URL
    ? normalizeUrl('NEXT_PUBLIC_TOWER_SYNC_URL', env.NEXT_PUBLIC_TOWER_SYNC_URL, ['ws:', 'wss:'])
    : deriveTowerSyncUrl(towerApiUrl);

  return {
    controllerAdminToken,
    controllerApiUrl,
    towerApiUrl,
    towerSyncUrl,
  };
}

export function getControllerApiUrl(env?: WorkerEndpointEnv): string {
  return resolveWorkerEndpoints(env).controllerApiUrl;
}

export function getControllerAdminHeaders(env?: WorkerEndpointEnv): Record<string, string> {
  return {
    'x-aero-admin-token': resolveWorkerEndpoints(env).controllerAdminToken,
  };
}

export function getTowerApiUrl(env?: WorkerEndpointEnv): string {
  return normalizeUrl('NEXT_PUBLIC_TOWER_API_URL', (env ?? publicWorkerEnv).NEXT_PUBLIC_TOWER_API_URL, ['http:', 'https:']);
}

export function getTowerSyncUrl(env?: WorkerEndpointEnv): string {
  const targetEnv = env ?? publicWorkerEnv;
  const towerApiUrl = getTowerApiUrl(targetEnv);
  return targetEnv.NEXT_PUBLIC_TOWER_SYNC_URL
    ? normalizeUrl('NEXT_PUBLIC_TOWER_SYNC_URL', targetEnv.NEXT_PUBLIC_TOWER_SYNC_URL, ['ws:', 'wss:'])
    : deriveTowerSyncUrl(towerApiUrl);
}

export interface WorkerEndpointEnv {
  NEXT_PUBLIC_CONTROLLER_API_URL?: string;
  NEXT_PUBLIC_TOWER_API_URL?: string;
  NEXT_PUBLIC_TOWER_SYNC_URL?: string;
}

export interface WorkerEndpoints {
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
  NEXT_PUBLIC_CONTROLLER_API_URL: process.env.NEXT_PUBLIC_CONTROLLER_API_URL,
  NEXT_PUBLIC_TOWER_API_URL: process.env.NEXT_PUBLIC_TOWER_API_URL,
  NEXT_PUBLIC_TOWER_SYNC_URL: process.env.NEXT_PUBLIC_TOWER_SYNC_URL,
};

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

export function resolveWorkerEndpoints(env: WorkerEndpointEnv = publicWorkerEnv): WorkerEndpoints {
  const controllerApiUrl = normalizeUrl('NEXT_PUBLIC_CONTROLLER_API_URL', env.NEXT_PUBLIC_CONTROLLER_API_URL, ['http:', 'https:']);
  const towerApiUrl = normalizeUrl('NEXT_PUBLIC_TOWER_API_URL', env.NEXT_PUBLIC_TOWER_API_URL, ['http:', 'https:']);
  const towerSyncUrl = env.NEXT_PUBLIC_TOWER_SYNC_URL
    ? normalizeUrl('NEXT_PUBLIC_TOWER_SYNC_URL', env.NEXT_PUBLIC_TOWER_SYNC_URL, ['ws:', 'wss:'])
    : deriveTowerSyncUrl(towerApiUrl);

  return {
    controllerApiUrl,
    towerApiUrl,
    towerSyncUrl,
  };
}

export function getControllerApiUrl(env?: WorkerEndpointEnv): string {
  return resolveWorkerEndpoints(env).controllerApiUrl;
}

export function getTowerApiUrl(env?: WorkerEndpointEnv): string {
  return resolveWorkerEndpoints(env).towerApiUrl;
}

export function getTowerSyncUrl(env?: WorkerEndpointEnv): string {
  return resolveWorkerEndpoints(env).towerSyncUrl;
}


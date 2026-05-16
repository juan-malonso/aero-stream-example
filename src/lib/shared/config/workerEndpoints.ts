export interface WorkerEndpointEnv {
  NODE_ENV?: string;
  NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN?: string;
  NEXT_PUBLIC_CONTROLLER_API_URL?: string;
  NEXT_PUBLIC_TOWER_INIT_URL?: string;
  NEXT_PUBLIC_TOWER_LIVE_URL?: string;
}

export interface WorkerEndpoints {
  controllerAdminToken: string;
  controllerApiUrl: string;
  towerInitUrl: string;
  towerLiveUrl: string;
}

export class WorkerEndpointConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkerEndpointConfigError";
  }
}

const publicWorkerEnv: WorkerEndpointEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN:
    process.env.NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN,
  NEXT_PUBLIC_CONTROLLER_API_URL: process.env.NEXT_PUBLIC_CONTROLLER_API_URL,
  NEXT_PUBLIC_TOWER_INIT_URL: process.env.NEXT_PUBLIC_TOWER_INIT_URL,
  NEXT_PUBLIC_TOWER_LIVE_URL: process.env.NEXT_PUBLIC_TOWER_LIVE_URL,
};

const LOCAL_TEST_CONTROLLER_ADMIN_TOKEN = "local-test-admin-token";
const LOCAL_CONTROLLER_API_URL = "http://localhost:8788/api";
const LOCAL_TOWER_INIT_URL = "http://localhost:8787/squawk/init";
const LOCAL_TOWER_LIVE_URL = "ws://localhost:8787/squawk/live";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeUrl(
  name: keyof WorkerEndpointEnv,
  value: string | undefined,
  protocols: string[],
): string {
  const raw = value?.trim();
  if (!raw) {
    throw new WorkerEndpointConfigError(
      `Missing ${name}. Configure ${name} for the example worker integration.`,
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new WorkerEndpointConfigError(
      `Invalid ${name}. Expected an absolute URL, received "${raw}".`,
    );
  }

  if (!protocols.includes(url.protocol)) {
    throw new WorkerEndpointConfigError(
      `Invalid ${name}. Expected protocol ${protocols.join(" or ")}, received "${url.protocol}".`,
    );
  }

  return url.toString().replace(/\/$/, "");
}

function requireValue(
  name: keyof WorkerEndpointEnv,
  value: string | undefined,
): string {
  const raw = value?.trim();
  if (!raw) {
    throw new WorkerEndpointConfigError(
      `Missing ${name}. Configure ${name} for the example worker integration.`,
    );
  }
  return raw;
}

function valueOrLocalDefault(
  env: WorkerEndpointEnv,
  value: string | undefined,
  localDefault: string,
): string | undefined {
  if (value?.trim()) return value;
  return env.NODE_ENV !== "production" ? localDefault : undefined;
}

function resolveControllerAdminToken(
  env: WorkerEndpointEnv,
  controllerApiUrl: string,
): string {
  const raw = env.NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN?.trim();
  if (raw) return raw;

  const { hostname } = new URL(controllerApiUrl);
  if (env.NODE_ENV !== "production" && LOCAL_HOSTNAMES.has(hostname)) {
    return LOCAL_TEST_CONTROLLER_ADMIN_TOKEN;
  }

  return requireValue(
    "NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN",
    env.NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN,
  );
}

export function resolveWorkerEndpoints(
  env: WorkerEndpointEnv = publicWorkerEnv,
): WorkerEndpoints {
  const controllerApiUrl = normalizeUrl(
    "NEXT_PUBLIC_CONTROLLER_API_URL",
    valueOrLocalDefault(
      env,
      env.NEXT_PUBLIC_CONTROLLER_API_URL,
      LOCAL_CONTROLLER_API_URL,
    ),
    ["http:", "https:"],
  );
  const controllerAdminToken = resolveControllerAdminToken(
    env,
    controllerApiUrl,
  );
  const towerInitUrl = normalizeUrl(
    "NEXT_PUBLIC_TOWER_INIT_URL",
    valueOrLocalDefault(
      env,
      env.NEXT_PUBLIC_TOWER_INIT_URL,
      LOCAL_TOWER_INIT_URL,
    ),
    ["http:", "https:"],
  );
  const towerLiveUrl = normalizeUrl(
    "NEXT_PUBLIC_TOWER_LIVE_URL",
    valueOrLocalDefault(
      env,
      env.NEXT_PUBLIC_TOWER_LIVE_URL,
      LOCAL_TOWER_LIVE_URL,
    ),
    ["ws:", "wss:"],
  );

  return {
    controllerAdminToken,
    controllerApiUrl,
    towerInitUrl,
    towerLiveUrl,
  };
}

export function getControllerApiUrl(env?: WorkerEndpointEnv): string {
  return resolveWorkerEndpoints(env).controllerApiUrl;
}

export function getControllerAdminHeaders(
  env?: WorkerEndpointEnv,
): Record<string, string> {
  return {
    "x-aero-admin-token": resolveWorkerEndpoints(env).controllerAdminToken,
  };
}

export function getTowerInitUrl(env?: WorkerEndpointEnv): string {
  const targetEnv = env ?? publicWorkerEnv;
  return normalizeUrl(
    "NEXT_PUBLIC_TOWER_INIT_URL",
    valueOrLocalDefault(
      targetEnv,
      targetEnv.NEXT_PUBLIC_TOWER_INIT_URL,
      LOCAL_TOWER_INIT_URL,
    ),
    ["http:", "https:"],
  );
}

export function getTowerLiveUrl(env?: WorkerEndpointEnv): string {
  const targetEnv = env ?? publicWorkerEnv;
  return normalizeUrl(
    "NEXT_PUBLIC_TOWER_LIVE_URL",
    valueOrLocalDefault(
      targetEnv,
      targetEnv.NEXT_PUBLIC_TOWER_LIVE_URL,
      LOCAL_TOWER_LIVE_URL,
    ),
    ["ws:", "wss:"],
  );
}

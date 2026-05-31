import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveWorkerEndpoints,
  WorkerEndpointConfigError,
} from "./workerEndpoints.ts";

test("requires the Controller API URL for management boundaries", () => {
  assert.throws(
    () =>
      resolveWorkerEndpoints({
        NODE_ENV: "production",
        NEXT_PUBLIC_TOWER_INIT_URL: "http://localhost:8787/squawk/init",
        NEXT_PUBLIC_TOWER_LIVE_URL: "ws://localhost:8787/squawk/live",
      }),
    (error) =>
      error instanceof WorkerEndpointConfigError &&
      error.message.includes("Missing NEXT_PUBLIC_CONTROLLER_API_URL"),
  );
});

test("defaults local worker endpoints for development", () => {
  const endpoints = resolveWorkerEndpoints({
    NODE_ENV: "development",
  });

  assert.equal(endpoints.controllerApiUrl, "http://localhost:8788/api");
  assert.equal(endpoints.towerInitUrl, "http://localhost:8787/squawk/init");
  assert.equal(endpoints.towerLiveUrl, "ws://localhost:8787/squawk/live");
});

test("defaults local worker endpoints for a production bundle served on localhost", () => {
  const previousWindow = (globalThis as { window?: Window }).window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { hostname: "localhost" } },
  });

  try {
    const endpoints = resolveWorkerEndpoints({
      NODE_ENV: "production",
    });

    assert.equal(endpoints.controllerApiUrl, "http://localhost:8788/api");
    assert.equal(endpoints.towerInitUrl, "http://localhost:8787/squawk/init");
    assert.equal(endpoints.towerLiveUrl, "ws://localhost:8787/squawk/live");
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    }
  }
});

test("normalizes Controller and Tower full endpoint URLs", () => {
  const endpoints = resolveWorkerEndpoints({
    NEXT_PUBLIC_CONTROLLER_API_URL: "http://localhost:8788/api/",
    NEXT_PUBLIC_TOWER_INIT_URL: "http://localhost:8787/squawk/init/",
    NEXT_PUBLIC_TOWER_LIVE_URL: "ws://localhost:8787/squawk/live/",
  });

  assert.equal(endpoints.controllerApiUrl, "http://localhost:8788/api");
  assert.equal(endpoints.towerInitUrl, "http://localhost:8787/squawk/init");
  assert.equal(endpoints.towerLiveUrl, "ws://localhost:8787/squawk/live");
});

test("rejects WebSocket URLs in the Tower init endpoint", () => {
  assert.throws(
    () =>
      resolveWorkerEndpoints({
        NEXT_PUBLIC_CONTROLLER_API_URL: "http://localhost:8788/api",
        NEXT_PUBLIC_TOWER_INIT_URL: "ws://localhost:8787/squawk/init",
        NEXT_PUBLIC_TOWER_LIVE_URL: "ws://localhost:8787/squawk/live",
      }),
    (error) =>
      error instanceof WorkerEndpointConfigError &&
      error.message.includes("NEXT_PUBLIC_TOWER_INIT_URL") &&
      error.message.includes("http: or https:"),
  );
});

test("rejects runtime HTTP URLs in the Tower live endpoint", () => {
  assert.throws(
    () =>
      resolveWorkerEndpoints({
        NEXT_PUBLIC_CONTROLLER_API_URL: "http://localhost:8788/api",
        NEXT_PUBLIC_TOWER_INIT_URL: "http://localhost:8787/squawk/init",
        NEXT_PUBLIC_TOWER_LIVE_URL: "http://localhost:8787/squawk/live",
      }),
    (error) =>
      error instanceof WorkerEndpointConfigError &&
      error.message.includes("NEXT_PUBLIC_TOWER_LIVE_URL") &&
      error.message.includes("ws: or wss:"),
  );
});

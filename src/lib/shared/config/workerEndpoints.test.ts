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
        NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN: "local-test-admin-token",
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

  assert.equal(endpoints.controllerAdminToken, "local-test-admin-token");
  assert.equal(endpoints.controllerApiUrl, "http://localhost:8788/api");
  assert.equal(endpoints.towerInitUrl, "http://localhost:8787/squawk/init");
  assert.equal(endpoints.towerLiveUrl, "ws://localhost:8787/squawk/live");
});

test("normalizes Controller and Tower full endpoint URLs", () => {
  const endpoints = resolveWorkerEndpoints({
    NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN: "local-test-admin-token",
    NEXT_PUBLIC_CONTROLLER_API_URL: "http://localhost:8788/api/",
    NEXT_PUBLIC_TOWER_INIT_URL: "http://localhost:8787/squawk/init/",
    NEXT_PUBLIC_TOWER_LIVE_URL: "ws://localhost:8787/squawk/live/",
  });

  assert.equal(endpoints.controllerAdminToken, "local-test-admin-token");
  assert.equal(endpoints.controllerApiUrl, "http://localhost:8788/api");
  assert.equal(endpoints.towerInitUrl, "http://localhost:8787/squawk/init");
  assert.equal(endpoints.towerLiveUrl, "ws://localhost:8787/squawk/live");
});

test("defaults the Controller admin token for local development URLs", () => {
  const endpoints = resolveWorkerEndpoints({
    NODE_ENV: "development",
    NEXT_PUBLIC_CONTROLLER_API_URL: "http://localhost:8788/api",
    NEXT_PUBLIC_TOWER_INIT_URL: "http://localhost:8787/squawk/init",
    NEXT_PUBLIC_TOWER_LIVE_URL: "ws://localhost:8787/squawk/live",
  });

  assert.equal(endpoints.controllerAdminToken, "local-test-admin-token");
});

test("requires an explicit Controller admin token for non-local URLs", () => {
  assert.throws(
    () =>
      resolveWorkerEndpoints({
        NODE_ENV: "production",
        NEXT_PUBLIC_CONTROLLER_API_URL: "https://controller.example.com/api",
        NEXT_PUBLIC_TOWER_INIT_URL: "https://tower.example.com/squawk/init",
        NEXT_PUBLIC_TOWER_LIVE_URL: "wss://tower.example.com/squawk/live",
      }),
    (error) =>
      error instanceof WorkerEndpointConfigError &&
      error.message.includes("Missing NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN"),
  );
});

test("rejects WebSocket URLs in the Tower init endpoint", () => {
  assert.throws(
    () =>
      resolveWorkerEndpoints({
        NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN: "local-test-admin-token",
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
        NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN: "local-test-admin-token",
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

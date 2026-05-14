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
        NEXT_PUBLIC_TOWER_API_URL: "http://localhost:8787",
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
  assert.equal(endpoints.controllerApiUrl, "http://localhost:8787/api");
  assert.equal(endpoints.towerApiUrl, "http://localhost:8787");
  assert.equal(endpoints.towerSyncUrl, "ws://localhost:8787/app/sync");
});

test("normalizes Controller and Tower URLs and derives Tower sync URL", () => {
  const endpoints = resolveWorkerEndpoints({
    NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN: "local-test-admin-token",
    NEXT_PUBLIC_CONTROLLER_API_URL: "http://localhost:8787/api/",
    NEXT_PUBLIC_TOWER_API_URL: "http://localhost:8787/",
  });

  assert.equal(endpoints.controllerAdminToken, "local-test-admin-token");
  assert.equal(endpoints.controllerApiUrl, "http://localhost:8787/api");
  assert.equal(endpoints.towerApiUrl, "http://localhost:8787");
  assert.equal(endpoints.towerSyncUrl, "ws://localhost:8787/app/sync");
});

test("defaults the Controller admin token for local development URLs", () => {
  const endpoints = resolveWorkerEndpoints({
    NODE_ENV: "development",
    NEXT_PUBLIC_CONTROLLER_API_URL: "http://localhost:8787/api",
    NEXT_PUBLIC_TOWER_API_URL: "http://localhost:8787",
  });

  assert.equal(endpoints.controllerAdminToken, "local-test-admin-token");
});

test("requires an explicit Controller admin token for non-local URLs", () => {
  assert.throws(
    () =>
      resolveWorkerEndpoints({
        NODE_ENV: "production",
        NEXT_PUBLIC_CONTROLLER_API_URL: "https://controller.example.com/api",
        NEXT_PUBLIC_TOWER_API_URL: "https://tower.example.com",
      }),
    (error) =>
      error instanceof WorkerEndpointConfigError &&
      error.message.includes("Missing NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN"),
  );
});

test("allows an explicit Tower WebSocket URL for Pilot runtime paths", () => {
  const endpoints = resolveWorkerEndpoints({
    NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN: "local-test-admin-token",
    NEXT_PUBLIC_CONTROLLER_API_URL: "https://controller.example.com/api",
    NEXT_PUBLIC_TOWER_API_URL: "https://tower.example.com",
    NEXT_PUBLIC_TOWER_SYNC_URL: "wss://sync.example.com/app/sync/",
  });

  assert.equal(endpoints.towerSyncUrl, "wss://sync.example.com/app/sync");
});

test("rejects runtime HTTP URLs in the Tower WebSocket override", () => {
  assert.throws(
    () =>
      resolveWorkerEndpoints({
        NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN: "local-test-admin-token",
        NEXT_PUBLIC_CONTROLLER_API_URL: "http://localhost:8787/api",
        NEXT_PUBLIC_TOWER_API_URL: "http://localhost:8787",
        NEXT_PUBLIC_TOWER_SYNC_URL: "http://localhost:8787/app/sync",
      }),
    (error) =>
      error instanceof WorkerEndpointConfigError &&
      error.message.includes("NEXT_PUBLIC_TOWER_SYNC_URL") &&
      error.message.includes("ws: or wss:"),
  );
});

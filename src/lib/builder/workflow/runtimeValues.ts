export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readPath(source: unknown, path: readonly string[]): unknown {
  if (path.length === 0) return source;

  let currentValue = source;
  for (const segment of path) {
    if (!isRecord(currentValue)) return undefined;
    currentValue = currentValue[segment];
  }

  return currentValue;
}

export function toStringRecord(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === 'string' ? item : JSON.stringify(item),
    ]),
  );
}

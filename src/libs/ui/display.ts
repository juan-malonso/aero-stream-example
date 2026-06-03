export function formatDisplayValue(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined) return fallback;

  switch (typeof value) {
    case 'string':
      return value.length > 0 ? value : fallback;
    case 'number':
      return Number.isFinite(value) ? String(value) : fallback;
    case 'boolean':
      return value ? 'true' : 'false';
    case 'bigint':
      return value.toString();
    default: {
      try {
        return JSON.stringify(value) ?? fallback;
      } catch {
        return fallback;
      }
    }
  }
}

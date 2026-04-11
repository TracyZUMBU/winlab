import type { MonitoringError } from "./types";

function stringifySafe(value: unknown): string {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export function normalizeError(error: unknown): MonitoringError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message || stringifySafe(error),
      stack: error.stack,
    };
  }

  return {
    message: stringifySafe(error),
  };
}

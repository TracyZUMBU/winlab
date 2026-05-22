import { monitoring } from "@/src/lib/monitoring";

/**
 * Reports a blocking bootstrap failure (startup error screen).
 * Call once before rethrowing from the single bootstrap session path.
 */
export function reportBootstrapFatalError(
  error: unknown,
  extra?: Record<string, string>,
): void {
  monitoring.captureException({
    name: "app_bootstrap_fatal",
    severity: "error",
    feature: "bootstrap",
    message: "App bootstrap failed at startup (blocking)",
    error,
    extra,
  });
}

import {
  ConsoleMonitoringProvider,
  MonitoringService,
  SentryMonitoringProvider,
  SlackMonitoringProvider,
} from "@winlab/monitoring";
import type { MonitoringProvider } from "@winlab/monitoring";

import { getSupabaseClient, isSupabaseConfigured } from "../supabase";

/** Convention: stable `service` id for Slack — must match mobile pattern (`winlab-*`). */
const SERVICE_NAME = "winlab-admin";

function isDevelopmentEnvironment(): boolean {
  return import.meta.env.DEV;
}

function getSlackEdgeFunctionName(): string {
  const name = import.meta.env.VITE_MONITORING_SLACK_EDGE_FUNCTION_NAME;
  return typeof name === "string" && name.trim().length > 0
    ? name.trim()
    : "monitoring-slack";
}

const environment = isDevelopmentEnvironment() ? "development" : "production";

function buildProviders(): MonitoringProvider[] {
  const isDev = isDevelopmentEnvironment();
  const list: MonitoringProvider[] = [];

  if (isDev) {
    list.push(new ConsoleMonitoringProvider());
  }

  if (!isDev && isSupabaseConfigured()) {
    list.push(
      new SlackMonitoringProvider({
        supabaseClient: getSupabaseClient(),
        edgeFunctionName: getSlackEdgeFunctionName(),
      }),
    );
  }

  if (import.meta.env.VITE_SENTRY_DSN) {
    list.push(new SentryMonitoringProvider());
  }

  if (!isDev && list.length === 0) {
    console.warn(
      "[monitoring] No MonitoringProvider configured; using console fallback",
      {
        environment,
        slackSupabaseConfigured: isSupabaseConfigured(),
        sentryDsnConfigured: Boolean(import.meta.env.VITE_SENTRY_DSN),
      },
    );
    list.push(new ConsoleMonitoringProvider());
  }

  return list;
}

export const monitoring = new MonitoringService({
  environment,
  service: SERVICE_NAME,
  providers: buildProviders(),
});

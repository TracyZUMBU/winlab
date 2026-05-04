import {
  ConsoleMonitoringProvider,
  MonitoringService,
  SlackMonitoringProvider,
  type MonitoringProvider,
} from "@winlab/monitoring";

import { logger } from "@/src/lib/logger";
import { isDevelopmentEnvironment } from "@/src/lib/logger/environment";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { supabaseEnv } from "@/src/lib/supabase/env";

/**
 * Human-readable service id for Slack / dashboards.
 * Convention: `winlab-mobile` (override via EXPO_PUBLIC_SERVICE_NAME).
 */
function getServiceName(): string {
  const serviceName = process.env.EXPO_PUBLIC_SERVICE_NAME;
  return typeof serviceName === "string" && serviceName.trim().length > 0
    ? serviceName.trim()
    : "winlab-mobile";
}

function getSlackEdgeFunctionName(): string {
  const name = process.env.EXPO_PUBLIC_MONITORING_SLACK_EDGE_FUNCTION_NAME;
  return typeof name === "string" && name.trim().length > 0
    ? name.trim()
    : "monitoring-slack";
}

const environment = isDevelopmentEnvironment() ? "development" : "production";
const service = getServiceName();

function buildProviders(): MonitoringProvider[] {
  const isDev = isDevelopmentEnvironment();
  const list: MonitoringProvider[] = [];

  if (isDev) {
    list.push(
      new ConsoleMonitoringProvider({
        sink: {
          log: (msg, meta) => logger.log(msg, meta),
          warn: (msg, meta) => logger.warn(msg, meta),
          error: (msg, err, meta) => logger.error(msg, err, meta),
        },
      }),
    );
  }

  if (!isDev && supabaseEnv.isConfigured) {
    // TODO(debug): après stabilité auth — réduire le bruit Slack (ne plus envoyer `info`/`debug`, voir SlackMonitoringProvider).
    list.push(
      new SlackMonitoringProvider({
        supabaseClient: getSupabaseClient(),
        edgeFunctionName: getSlackEdgeFunctionName(),
      }),
    );
  }

  if (!isDev && list.length === 0) {
    logger.warn(
      "[monitoring] No MonitoringProvider configured; using console fallback",
      {
        environment,
        slackSupabaseConfigured: supabaseEnv.isConfigured,
      },
    );
    list.push(
      new ConsoleMonitoringProvider({
        sink: {
          log: (msg, meta) => logger.log(msg, meta),
          warn: (msg, meta) => logger.warn(msg, meta),
          error: (msg, err, meta) => logger.error(msg, err, meta),
        },
      }),
    );
  }

  return list;
}

export const monitoring = new MonitoringService({
  environment,
  service,
  providers: buildProviders(),
  onProviderDispatchFailure: ({ reason }) => {
    logger.warn("[monitoring] Provider dispatch failed", { error: reason });
  },
});

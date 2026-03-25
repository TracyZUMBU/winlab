import { isDevelopmentEnvironment } from "@/src/lib/logger/environment";
import { logger } from "@/src/lib/logger";

import { supabaseEnv } from "@/src/lib/supabase/env";
import { getSupabaseClient } from "@/src/lib/supabase/client";

import { MonitoringService } from "./monitoring-service";
import { ConsoleMonitoringProvider } from "./providers/console-monitoring-provider";
import { SlackMonitoringProvider } from "./providers/slack-monitoring-provider";
import { SentryMonitoringProvider } from "./providers/sentry-monitoring-provider";
import type { MonitoringProvider } from "./providers/monitoring-provider";

function getEnvironmentLabel(): string {
  return isDevelopmentEnvironment() ? "development" : "production";
}

function getServiceName(): string {
  // EXPO_PUBLIC_*: valeur exposee au runtime Expo.
  // Ici ce n est pas un secret: c est un label pour le monitoring.
  const serviceName = process.env.EXPO_PUBLIC_SERVICE_NAME;
  return typeof serviceName === "string" && serviceName.trim().length > 0
    ? serviceName
    : "mobile";
}

function getSlackEdgeFunctionName(): string {
  const name = process.env.EXPO_PUBLIC_MONITORING_SLACK_EDGE_FUNCTION_NAME;
  return typeof name === "string" && name.trim().length > 0 ? name : "monitoring-slack";
}

const environment = getEnvironmentLabel();
const service = getServiceName();

const providers = (() => {
  const isDev = isDevelopmentEnvironment();
  const list: MonitoringProvider[] = [];

  if (isDev) {
    list.push(new ConsoleMonitoringProvider());
  }

  // Slack: best effort en production uniquement.
  // On evite envoyer en dev pour limiter le bruit.
  if (!isDev && supabaseEnv.isConfigured) {
    list.push(
      new SlackMonitoringProvider({
        supabaseClient: getSupabaseClient(),
        edgeFunctionName: getSlackEdgeFunctionName(),
      }),
    );
  }

  // Sentry stub: branchable sans casser l'API metier.
  if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
    list.push(new SentryMonitoringProvider());
  }

  if (!isDev && list.length === 0) {
    // If no provider is configured in production, events would otherwise be dropped silently.
    // Add a lightweight console fallback so monitoring remains observable.
    logger.warn("[monitoring] No MonitoringProvider configured; using console fallback", {
      environment: getEnvironmentLabel(),
      slackSupabaseConfigured: supabaseEnv.isConfigured,
      sentryDsnConfigured: Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
    });
    list.push(new ConsoleMonitoringProvider());
  }

  return list;
})();

export const monitoring = new MonitoringService({
  environment,
  service,
  providers,
});

export type { MonitoringSeverity, MonitoringEvent } from "./types";


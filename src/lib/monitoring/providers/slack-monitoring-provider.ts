import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/src/lib/logger";

import type { MonitoringEvent, MonitoringSeverity } from "../types";
import type { MonitoringProvider } from "./monitoring-provider";

const DEFAULT_EDGE_FUNCTION_NAME = "monitoring-slack";

function shouldSendToSlack(severity: MonitoringSeverity): boolean {
  // We avoid spamming Slack with debug/info.
  return (
    severity === "warning" || severity === "error" || severity === "critical"
  );
}

export type SlackMonitoringProviderOptions = {
  supabaseClient: SupabaseClient;
  edgeFunctionName?: string;
};

export class SlackMonitoringProvider implements MonitoringProvider {
  private readonly supabaseClient: SupabaseClient;
  private readonly edgeFunctionName: string;

  constructor(options: SlackMonitoringProviderOptions) {
    this.supabaseClient = options.supabaseClient;
    this.edgeFunctionName =
      options.edgeFunctionName ?? DEFAULT_EDGE_FUNCTION_NAME;
  }

  public async capture(event: MonitoringEvent): Promise<void> {
    if (!shouldSendToSlack(event.severity)) return;

    try {
      const { data, error } = await this.supabaseClient.functions.invoke(
        this.edgeFunctionName,
        {
        body: { event },
        },
      );

      if (error) {
        logger.warn("[monitoring] Slack provider failed", {
          edgeFunctionName: this.edgeFunctionName,
          // Provide the actual error object/string (not just network exceptions).
          error,
        });

        throw error instanceof Error ? error : new Error(String(error));
      }

      // The edge function returns plain string bodies (e.g. "ok" or "Slack webhook not configured").
      if (typeof data === "string" && data.trim().toLowerCase() !== "ok") {
        logger.warn("[monitoring] Slack provider failed", {
          edgeFunctionName: this.edgeFunctionName,
          error: data,
          data,
        });

        throw new Error(
          `Slack edge function returned non-ok response: ${data}`,
        );
      }
    } catch (error) {
      logger.warn("[monitoring] Slack provider failed", {
        edgeFunctionName: this.edgeFunctionName,
        // We keep it short: the MonitoringService normalizes errors.
        error,
      });

      // Surface provider failures to `MonitoringService` so they are not silently ignored.
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}

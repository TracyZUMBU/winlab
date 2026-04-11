import type { MonitoringEvent, MonitoringSeverity } from "../types";
import type { MonitoringProvider } from "./monitoring-provider";

const DEFAULT_EDGE_FUNCTION_NAME = "monitoring-slack";

function shouldSendToSlack(severity: MonitoringSeverity): boolean {
  return (
    severity === "warning" || severity === "error" || severity === "critical"
  );
}

/**
 * Minimal Supabase client surface for `functions.invoke` (avoids coupling to a
 * specific `@supabase/supabase-js` generic instance across workspaces).
 * Any `SupabaseClient` from the app satisfies this structurally.
 */
export type MonitoringFunctionsInvokeClient = {
  functions: {
    invoke(
      functionName: string,
      options: {
        body: { event: MonitoringEvent };
      },
    ): Promise<{ data: unknown; error: unknown }>;
  };
};

export type SlackMonitoringProviderOptions = {
  supabaseClient: MonitoringFunctionsInvokeClient;
  edgeFunctionName?: string;
};

/**
 * Sends sanitized events to the Supabase Edge Function `monitoring-slack` (body: `{ event }`).
 */
export class SlackMonitoringProvider implements MonitoringProvider {
  private readonly supabaseClient: MonitoringFunctionsInvokeClient;
  private readonly edgeFunctionName: string;

  constructor(options: SlackMonitoringProviderOptions) {
    this.supabaseClient = options.supabaseClient;
    this.edgeFunctionName =
      options.edgeFunctionName ?? DEFAULT_EDGE_FUNCTION_NAME;
  }

  public async capture(event: MonitoringEvent): Promise<void> {
    if (!shouldSendToSlack(event.severity)) return;

    const { data, error } = await this.supabaseClient.functions.invoke(
      this.edgeFunctionName,
      {
        body: { event },
      },
    );

    if (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }

    // Edge function should return "ok" string on success
    if (
      data !== "ok" &&
      (typeof data !== "string" || data.trim().toLowerCase() !== "ok")
    ) {
      throw new Error(
        `Slack edge function returned unexpected response: ${JSON.stringify(data)}`,
      );
    }
  }
}

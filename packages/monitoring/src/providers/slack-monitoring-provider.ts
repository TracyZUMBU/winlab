import type { MonitoringEvent } from "../types";
import type { MonitoringProvider } from "./monitoring-provider";

const DEFAULT_EDGE_FUNCTION_NAME = "monitoring-slack";

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

type SlackMonitoringProviderBaseOptions = {
  edgeFunctionName?: string;
};

export type SlackMonitoringProviderOptions = SlackMonitoringProviderBaseOptions &
  (
    | { supabaseClient: MonitoringFunctionsInvokeClient }
    | { functionsBaseUrl: string; anonKey: string }
  );

function assertOkResponse(data: unknown): void {
  if (
    data !== "ok" &&
    (typeof data !== "string" || data.trim().toLowerCase() !== "ok")
  ) {
    throw new Error(
      `Slack edge function returned unexpected response: ${JSON.stringify(data)}`,
    );
  }
}

/**
 * Sends sanitized events to the Supabase Edge Function `monitoring-slack` (body: `{ event }`).
 *
 * Prefer `{ functionsBaseUrl, anonKey }` on mobile so monitoring does not depend on
 * `createClient` (bootstrap may fail before the Supabase client can be constructed).
 */
export class SlackMonitoringProvider implements MonitoringProvider {
  private readonly edgeFunctionName: string;
  private readonly supabaseClient: MonitoringFunctionsInvokeClient | null;
  private readonly functionsBaseUrl: string | null;
  private readonly anonKey: string | null;

  constructor(options: SlackMonitoringProviderOptions) {
    this.edgeFunctionName =
      options.edgeFunctionName ?? DEFAULT_EDGE_FUNCTION_NAME;

    if ("supabaseClient" in options) {
      this.supabaseClient = options.supabaseClient;
      this.functionsBaseUrl = null;
      this.anonKey = null;
    } else {
      this.supabaseClient = null;
      this.functionsBaseUrl = options.functionsBaseUrl.replace(/\/$/, "");
      this.anonKey = options.anonKey;
    }
  }

  public async capture(event: MonitoringEvent): Promise<void> {
    // TODO(debug): filtrer à nouveau — ne pas envoyer `info` ni `debug` vers Slack en prod (bruit).
    const body = { event };

    if (this.functionsBaseUrl && this.anonKey) {
      await this.captureViaFetch(body);
      return;
    }

    if (!this.supabaseClient) {
      throw new Error("SlackMonitoringProvider: no transport configured");
    }

    const { data, error } = await this.supabaseClient.functions.invoke(
      this.edgeFunctionName,
      { body },
    );

    if (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }

    assertOkResponse(data);
  }

  private async captureViaFetch(body: {
    event: MonitoringEvent;
  }): Promise<void> {
    const url = `${this.functionsBaseUrl}/${this.edgeFunctionName}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.anonKey}`,
        apikey: this.anonKey!,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Slack edge function HTTP ${response.status}: ${responseText}`,
      );
    }

    assertOkResponse(responseText);
  }
}

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type MonitoringError = {
  name?: string;
  message: string;
  stack?: string;
};

type MonitoringEventBase = {
  type: "message" | "exception";
  name: string;
  message: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  timestamp: number;
  environment: string;
  service: string;
  feature?: string;
  userId?: string;
  requestId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  error?: MonitoringError;
};

type RequestPayload = {
  event?: MonitoringEventBase;
};

function shouldSendToSlack(severity: MonitoringEventBase["severity"]): boolean {
  // We avoid sending unnecessary debug/info.
  return (
    severity === "warning" || severity === "error" || severity === "critical"
  );
}

function formatSlackText(event: MonitoringEventBase): string {
  const context: Record<string, unknown> = {
    userId: event.userId,
    requestId: event.requestId,
    tags: event.tags,
    extra: event.extra,
    error: event.error,
  };

  const contextJson = JSON.stringify(context, null, 2);
  const featureLine = event.feature ? `Feature: ${event.feature}` : undefined;

  return [
    `*Monitoring: ${event.name}*`,
    `Severity: ${event.severity}`,
    `Environment: ${event.environment}`,
    `Service: ${event.service}`,
    featureLine ? `Feature: ${event.feature}` : undefined,
    `Message: ${event.message}`,
    "Context:",
    `\`\`\`${contextJson}\`\`\``,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = (await req.json().catch(() => null)) as RequestPayload | null;
  const event = payload?.event;

  if (!event) {
    return new Response("Missing event payload", { status: 400 });
  }

  if (!shouldSendToSlack(event.severity)) {
    return new Response("Skipped (severity)", { status: 200 });
  }

  const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!slackWebhookUrl) {
    // Best effort: if not configured, we don't fail client-side.
    return new Response("Slack webhook not configured", { status: 200 });
  }

  const text = formatSlackText(event);

  const response = await fetch(slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    return new Response("Slack webhook request failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});

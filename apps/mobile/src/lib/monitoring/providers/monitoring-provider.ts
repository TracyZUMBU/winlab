import type { MonitoringEvent } from "../types";

export interface MonitoringProvider {
  capture(event: MonitoringEvent): Promise<void>;
}


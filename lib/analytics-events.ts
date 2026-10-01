// Typed wrapper over track() so event names and payloads cannot drift.
import { track } from "./openhelm-analytics";
import type { JourneyEvents } from "./analytics-journey";

export function trackJourney<K extends keyof JourneyEvents>(event: K, params: JourneyEvents[K]): boolean {
  return track(event, params as Record<string, unknown>);
}

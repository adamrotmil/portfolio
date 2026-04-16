import type { FlightState, ScenarioId } from "./types";

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  /** Patch to apply along with any navigation. */
  apply: (s: FlightState) => Partial<FlightState>;
  /** Resulting screen. */
  screen: FlightState["screen"];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "pair",
    label: "Pair",
    description: "Discover and connect to the plane",
    screen: "pair",
    apply: () => ({ signal: 0, battery: 92 }),
  },
  {
    id: "preflight",
    label: "Pre-flight",
    description: "Readiness checklist before arming",
    screen: "preflight",
    apply: () => ({ signal: 3, battery: 92 }),
  },
  {
    id: "takeoff",
    label: "Take off",
    description: "In-flight HUD with live telemetry",
    screen: "hud",
    apply: () => ({
      mode: "orbit",
      altitudeFt: 324,
      speedMph: 22,
      signal: 3,
      battery: 92,
      linkLostCountdown: null,
    }),
  },
  {
    id: "throttle",
    label: "Crown throttle",
    description: "Scroll the Crown to adjust",
    screen: "throttle",
    apply: () => ({ throttlePct: 72 }),
  },
  {
    id: "actions",
    label: "Quick actions",
    description: "Safety menu",
    screen: "actions",
    apply: () => ({}),
  },
  {
    id: "linklost",
    label: "Link lost",
    description: "Failsafe + auto-RTH countdown",
    screen: "linklost",
    apply: () => ({ signal: 0, linkLostCountdown: 3 }),
  },
  {
    id: "land",
    label: "Land · hold",
    description: "Press and hold to confirm",
    screen: "land",
    apply: () => ({ landing: false }),
  },
  {
    id: "postflight",
    label: "Post-flight",
    description: "Flight log and save",
    screen: "postflight",
    apply: () => ({}),
  },
];

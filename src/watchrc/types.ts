// Remote Flight — a smartwatch RC aircraft controller demo.
// Lives alongside the Foothills MUD inside the portfolio "Lab" section.

export type Screen =
  | "pair"
  | "preflight"
  | "hud"
  | "actions"
  | "throttle"
  | "linklost"
  | "land"
  | "postflight";

export type FlightMode = "orbit" | "manual" | "circle" | "rth" | "land";

export type TransitionKind =
  | "forward"     // push from right (standard watch page advance)
  | "backward"    // pop back to the left
  | "sheet"       // slide up from bottom (Quick Actions, destructive confirms)
  | "dismiss"     // slide down (closing a sheet)
  | "fade";       // cross-fade (failsafe / background state changes)

export interface FlightState {
  screen: Screen;
  lastScreen: Screen | null;
  transition: TransitionKind;

  // Plane telemetry
  battery: number;           // 0–100, plane battery
  signal: number;            // 0–4 bars
  altitudeFt: number;
  speedMph: number;
  headingDeg: number;
  mode: FlightMode;
  throttlePct: number;       // 0–100

  // Landing state — set after a successful hold-to-confirm
  landing: boolean;

  // Link-lost countdown (null when not active)
  linkLostCountdown: number | null;

  // Post-flight summary
  post: {
    duration: string;        // "12:42"
    batteryUsed: number;     // %
    distanceMi: number;
    maxAltFt: number;
  };
}

export type ScenarioId =
  | "pair"
  | "preflight"
  | "takeoff"
  | "orbit"
  | "throttle"
  | "actions"
  | "linklost"
  | "land"
  | "postflight";

import type { FlightState, Screen, TransitionKind } from "./types";

export const INITIAL_STATE: FlightState = {
  screen: "pair",
  lastScreen: null,
  transition: "forward",

  battery: 92,
  signal: 3,
  altitudeFt: 324,
  speedMph: 22,
  headingDeg: 87,
  mode: "orbit",
  throttlePct: 72,

  landing: false,

  linkLostCountdown: null,

  post: {
    duration: "12:42",
    batteryUsed: 38,
    distanceMi: 1.2,
    maxAltFt: 412,
  },
};

export type Action =
  | { type: "navigate"; to: Screen; transition?: TransitionKind }
  | { type: "set"; patch: Partial<FlightState> }
  | { type: "tick" }
  | { type: "reset" };

/** Pure-ish reducer; ticking state is driven by the host component. */
export function reducer(state: FlightState, action: Action): FlightState {
  switch (action.type) {
    case "navigate": {
      const transition = action.transition ?? inferTransition(state.screen, action.to);
      return {
        ...state,
        lastScreen: state.screen,
        screen: action.to,
        transition,
      };
    }
    case "set":
      return { ...state, ...action.patch };
    case "tick": {
      // Ambient drift on the HUD so it feels alive
      let next: FlightState = { ...state };
      if (state.screen === "hud") {
        next.altitudeFt = state.altitudeFt + (Math.random() - 0.5) * 6;
        next.speedMph = clamp(state.speedMph + (Math.random() - 0.5) * 1, 18, 28);
        next.headingDeg = (state.headingDeg + 1) % 360;
      }
      if (
        state.screen === "linklost" &&
        state.linkLostCountdown !== null &&
        state.linkLostCountdown > 0
      ) {
        next.linkLostCountdown = state.linkLostCountdown - 1;
      }
      return next;
    }
    case "reset":
      return INITIAL_STATE;
    default:
      return state;
  }
}

// Which way a transition should visually slide for a given pair of screens.
const FORWARD_ORDER: Screen[] = [
  "pair",
  "preflight",
  "hud",
  "throttle",
  "postflight",
];

function inferTransition(from: Screen, to: Screen): TransitionKind {
  if (to === "actions") return "sheet";
  if (from === "actions") return "dismiss";
  if (to === "land") return "sheet";
  if (from === "land") return "dismiss";
  if (to === "linklost") return "fade";
  if (from === "linklost") return "fade";
  const a = FORWARD_ORDER.indexOf(from);
  const b = FORWARD_ORDER.indexOf(to);
  if (a !== -1 && b !== -1) return b >= a ? "forward" : "backward";
  return "forward";
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

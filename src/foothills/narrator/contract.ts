// Shared wire format between the Foothills client and the Narrator Worker.
// Keep in lockstep with workers/foothills-narrator/src/index.ts.

export type NarrateReason =
  | "unknown-verb"
  | "unknown-object"
  | "unknown-direction"
  | "unscripted-topic"
  | "generic";

export interface NarrateRequest {
  command: string;
  reason: NarrateReason;
  room: {
    id?: string;
    name: string;
    description: string;
    exits: string[];
    items: string[];
    occupants: { name: string; kind: "player" | "npc" | "mob" }[];
  };
  player: {
    hp: number;
    max_hp: number;
    inventory: string[];
  };
  target?: string;
  recent?: string[];
}

export interface NarrateResponse {
  lines: string[];
}

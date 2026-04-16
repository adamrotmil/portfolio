import type { Entity } from "./world";

export interface Player extends Entity {
  kind: "player";
  gold: number;
  playerXp: number;
  wielded: string | null;
}

export function levelForXp(xp: number): number {
  const thresholds = [0, 20, 50, 100, 200, 400, 800, 1600];
  let lvl = 1;
  thresholds.forEach((t, i) => {
    if (xp >= t) lvl = i + 1;
  });
  return lvl;
}

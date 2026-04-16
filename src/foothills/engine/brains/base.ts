import type { Entity } from "../world";
import type { EventBus, GameEvent } from "../events";
import type { World } from "../world";

export interface Brain {
  onTick(npc: Entity, world: World, bus: EventBus, tick: number): Promise<void> | void;
  onEvent?(npc: Entity, event: GameEvent, world: World, bus: EventBus): Promise<void> | void;
  onSpeech?(
    npc: Entity,
    speaker: Entity,
    text: string,
    world: World,
    bus: EventBus,
  ): Promise<string | null> | string | null;
}

export type BrainSpec = { type: string; params?: Record<string, unknown> };
type Factory = (params: Record<string, unknown>) => Brain;

const REGISTRY: Record<string, Factory> = {};

export function registerBrain(name: string, factory: Factory) {
  REGISTRY[name] = factory;
}

export function buildBrain(spec: BrainSpec): Brain {
  const f = REGISTRY[spec.type];
  if (!f) return REGISTRY["scripted"]({});
  return f(spec.params ?? {});
}

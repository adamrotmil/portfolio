export interface GameEvent {
  kind: string;
  room?: string | null;
  actor?: string | null;
  target?: string | null;
  data?: Record<string, unknown>;
}

type Listener = (e: GameEvent) => void;

export class EventBus {
  private subs: Record<string, Listener[]> = {};
  recent: GameEvent[] = [];
  private max = 64;

  on(kind: string, fn: Listener) {
    (this.subs[kind] ??= []).push(fn);
  }
  emit(e: GameEvent) {
    this.recent.push(e);
    if (this.recent.length > this.max) this.recent.shift();
    for (const fn of this.subs[e.kind] ?? []) fn(e);
    for (const fn of this.subs["*"] ?? []) fn(e);
  }
}

"use client";

import { useEffect, useRef, useState } from "react";

// Order-book ladder data.  Each level is [price, size].  Bids are ordered
// highest-price-first (best bid first); asks are ordered lowest-price-first
// (best ask first).  Both arrays capped at LEVELS.

export interface OrderbookLevel {
  price: number;
  size: number;
  /** Cumulative size from the top of book to this level. */
  cumulative: number;
}

export type OrderbookSource = "live" | "synthetic" | "none";

export interface OrderbookState {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  mid: number | null;
  spread: number | null;
  spreadPct: number | null;
  source: OrderbookSource;
}

export const LEVELS = 10;
const POLL_MS = 2000;
const REST_URL = "https://api.exchange.coinbase.com";

interface Options {
  productId: string | null;
  bestBid: number | null;
  bestAsk: number | null;
  /** When the real book fetch fails, synthesize around these. */
  decimals: number;
}

export function useOrderbook({ productId, bestBid, bestAsk, decimals }: Options): OrderbookState {
  const [state, setState] = useState<OrderbookState>({
    bids: [],
    asks: [],
    mid: null,
    spread: null,
    spreadPct: null,
    source: "none",
  });

  // Refs keep the poll loop stable — we don't want to tear it down every
  // time a fresh best-bid/ask number arrives.
  const bestBidRef = useRef(bestBid);
  const bestAskRef = useRef(bestAsk);
  const decimalsRef = useRef(decimals);
  bestBidRef.current = bestBid;
  bestAskRef.current = bestAsk;
  decimalsRef.current = decimals;

  // Real-book REST polling. When productId is null (demo) we skip polling
  // entirely and let the synthetic loop below drive the ladder.
  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(
          `${REST_URL}/products/${productId}/book?level=2`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`book ${res.status}`);
        const json = (await res.json()) as {
          bids: [string, string, number][];
          asks: [string, string, number][];
        };
        if (cancelled) return;
        const bids = normalize(json.bids, true);
        const asks = normalize(json.asks, false);
        if (bids.length && asks.length) {
          const mid = (bids[0].price + asks[0].price) / 2;
          const spread = asks[0].price - bids[0].price;
          setState({
            bids,
            asks,
            mid,
            spread,
            spreadPct: (spread / mid) * 100,
            source: "live",
          });
        }
      } catch {
        // Fall through — the synthetic effect below takes over when
        // source stays on `none` / goes back to `synthetic`.
        if (!cancelled) setState((s) => ({ ...s, source: s.source === "live" ? "synthetic" : "synthetic" }));
      }
      if (!cancelled) timer = setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [productId]);

  // Synthetic loop. Runs unconditionally and is harmless when the real
  // poll is overwriting the state (setState frequency is low enough).
  // It uses best-bid/ask refs so it tracks live anchors when we have them,
  // and a price-walk when we don't.
  useEffect(() => {
    if (productId) {
      // Real-coin: only synthesize if we haven't gotten a live snapshot yet,
      // OR if the poll is failing (source === "synthetic"). The real poll
      // will always overwrite us within POLL_MS when it works.
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const regen = () => {
        setState((s) => {
          if (s.source === "live") return s;
          const bb = bestBidRef.current;
          const ba = bestAskRef.current;
          if (!bb || !ba) return s;
          return synthesize(bb, ba, decimalsRef.current);
        });
        if (!cancelled) timer = setTimeout(regen, 1500);
      };

      regen();
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }

    // Demo coin: fully synthetic, driven by the value passed in as the
    // "best bid / ask" anchor (the Demo engine passes its current value).
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const regen = () => {
      const bb = bestBidRef.current;
      const ba = bestAskRef.current;
      if (bb && ba) {
        setState(synthesize(bb, ba, decimalsRef.current));
      }
      if (!cancelled) timer = setTimeout(regen, 900);
    };
    regen();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [productId]);

  return state;
}

// ---- helpers -----------------------------------------------------------

function normalize(
  raw: [string, string, number][] | undefined,
  isBid: boolean,
): OrderbookLevel[] {
  if (!raw) return [];
  const sorted = raw
    .map((row) => ({ price: Number(row[0]), size: Number(row[1]) }))
    .filter((r) => Number.isFinite(r.price) && Number.isFinite(r.size))
    .sort((a, b) => (isBid ? b.price - a.price : a.price - b.price))
    .slice(0, LEVELS);
  let cum = 0;
  return sorted.map((r) => {
    cum += r.size;
    return { ...r, cumulative: cum };
  });
}

/**
 * Synthesize a plausible order book around a known top-of-book.  The shape
 * (decaying size with distance, slight randomness) is meant to read as a
 * real book at a glance — not to model any specific market microstructure.
 */
function synthesize(bestBid: number, bestAsk: number, decimals: number): OrderbookState {
  const mid = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;
  // Widen levels proportionally to the spread so we don't get silly tight
  // bands on low-priced assets.
  const step = Math.max(spread, mid * 0.00015);

  const baseSize = Math.max(0.01, mid * 0.00015);

  const bids: OrderbookLevel[] = [];
  const asks: OrderbookLevel[] = [];

  let bidCum = 0;
  let askCum = 0;
  for (let i = 0; i < LEVELS; i++) {
    // Decaying-but-noisy size pattern
    const bidSize = baseSize * (1 + Math.random() * 1.6) * (1 - i / (LEVELS * 1.6));
    const askSize = baseSize * (1 + Math.random() * 1.6) * (1 - i / (LEVELS * 1.6));
    const bidPrice = roundTo(bestBid - step * i, decimals);
    const askPrice = roundTo(bestAsk + step * i, decimals);

    bidCum += bidSize;
    askCum += askSize;

    bids.push({ price: bidPrice, size: bidSize, cumulative: bidCum });
    asks.push({ price: askPrice, size: askSize, cumulative: askCum });
  }

  return {
    bids,
    asks,
    mid,
    spread,
    spreadPct: (spread / mid) * 100,
    source: "synthetic",
  };
}

function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

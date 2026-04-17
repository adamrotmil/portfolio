"use client";

import { useState } from "react";
import type { LivelinePoint } from "liveline";
import { COINS, type CoinId, type CoinMeta, formatPrice, isLive } from "./coins";
import { useLiveTicker } from "./useLiveTicker";
import { useDemoTicker, type DemoTickerApi } from "./useDemoTicker";
import { useOrderbook, type OrderbookState } from "./useOrderbook";

export interface SandboxApi {
  coin: CoinMeta;
  setCoin: (id: CoinId) => void;
  /** Chart data — always in Liveline's shape. */
  data: LivelinePoint[];
  value: number;
  formatValue: (v: number) => string;
  live: boolean;
  /** Best-bid/ask (real when live, synthesized from value when demo). */
  bestBid: number | null;
  bestAsk: number | null;
  /** Connection status for live feeds ("idle" when in demo). */
  status: "idle" | "connecting" | "open" | "error" | "closed";
  orderbook: OrderbookState;
  /** Demo-only controls.  Undefined when on a live coin. */
  demo?: DemoTickerApi;
}

export function useSandbox(): SandboxApi {
  const [coinId, setCoinId] = useState<CoinId>("BTC");
  const coin = COINS[coinId];

  // Run both engines always, but only surface one — this keeps the hook
  // order stable across coin switches. The inactive engine's overhead is
  // tiny (the WS either doesn't connect or gets cleanly closed).
  const live = useLiveTicker(coin.productId);
  const demo = useDemoTicker();

  const active = isLive(coinId)
    ? {
        data: live.data,
        value: live.value ?? 0,
        bestBid: live.bestBid,
        bestAsk: live.bestAsk,
        status: live.status,
      }
    : {
        data: demo.data,
        value: demo.value,
        // For demo, synthesize a plausible spread around the current value
        // so the order book has anchors.  ~0.02% spread, scaled by value.
        bestBid: demo.value * 0.9998,
        bestAsk: demo.value * 1.0002,
        status: "idle" as const,
      };

  const orderbook = useOrderbook({
    productId: coin.productId,
    bestBid: active.bestBid,
    bestAsk: active.bestAsk,
    decimals: coin.decimals,
  });

  return {
    coin,
    setCoin: setCoinId,
    data: active.data,
    value: active.value,
    formatValue: (v: number) => formatPrice(v, coin.decimals),
    live: isLive(coinId),
    bestBid: active.bestBid,
    bestAsk: active.bestAsk,
    status: active.status,
    orderbook,
    demo: isLive(coinId) ? undefined : demo,
  };
}

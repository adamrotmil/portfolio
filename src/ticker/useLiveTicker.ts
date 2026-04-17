"use client";

import { useEffect, useRef, useState } from "react";
import type { LivelinePoint } from "liveline";

// A thin WebSocket client for Coinbase Exchange's public ticker feed.
// The `ticker` channel at ws-feed.exchange.coinbase.com is public and
// emits a message every time a match happens, including best_bid and
// best_ask — perfect for driving Liveline and for anchoring the order
// book's top level.
//
//   https://docs.cdp.coinbase.com/exchange/websocket-feed/overview
//   Subscribe: {"type":"subscribe","product_ids":[...],"channels":["ticker"]}

const WS_URL = "wss://ws-feed.exchange.coinbase.com";

// Keep ~2 minutes of history so the 15s/30s/1m window selector has data
// for every option.
const TRIM_AFTER_SECS = 120;

export type ConnectionStatus = "idle" | "connecting" | "open" | "error" | "closed";

export interface LiveTickerState {
  /** LivelinePoint history — time in Unix seconds. */
  data: LivelinePoint[];
  /** Latest price. */
  value: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  /** Milliseconds of the latest ticker message. */
  lastTickAt: number | null;
  /** Rolling cumulative volume delta: Σ(buy - sell) since this coin was
   *  selected.  Positive = buyer-initiated pressure. */
  cvd: number;
  status: ConnectionStatus;
}

export function useLiveTicker(productId: string | null): LiveTickerState {
  const [state, setState] = useState<LiveTickerState>(initialState());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!productId) {
      // Sandbox moved to Demo segment → idle everything out.
      setState(initialState("idle"));
      return;
    }

    // Fresh buffer for the new product
    setState(initialState("connecting"));

    let ws: WebSocket | null = null;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(WS_URL);
      } catch (err) {
        scheduleReconnect();
        return;
      }

      ws.addEventListener("open", () => {
        attempt = 0;
        setState((s) => ({ ...s, status: "open" }));
        ws?.send(
          JSON.stringify({
            type: "subscribe",
            product_ids: [productId],
            channels: ["ticker"],
          }),
        );
      });

      ws.addEventListener("message", (evt) => {
        let msg: RawTicker;
        try {
          msg = JSON.parse(evt.data);
        } catch {
          return;
        }
        if (msg.type !== "ticker" || msg.product_id !== productId) return;
        const price = Number(msg.price);
        const bestBid = Number(msg.best_bid);
        const bestAsk = Number(msg.best_ask);
        if (!Number.isFinite(price)) return;

        // Trade delta: `side` is the taker side for the last match.
        // "buy" = taker hit the ask (buyer-initiated) → +size
        // "sell" = taker hit the bid (seller-initiated) → -size
        const lastSize = Number(msg.last_size);
        const sideDelta =
          msg.side === "buy" && Number.isFinite(lastSize)
            ? lastSize
            : msg.side === "sell" && Number.isFinite(lastSize)
              ? -lastSize
              : 0;

        const now = Date.now() / 1000;
        setState((s) => {
          const nextData = [...s.data, { time: now, value: price }];
          const cutoff = now - TRIM_AFTER_SECS;
          while (nextData.length && nextData[0].time < cutoff) nextData.shift();
          return {
            data: nextData,
            value: price,
            bestBid: Number.isFinite(bestBid) ? bestBid : s.bestBid,
            bestAsk: Number.isFinite(bestAsk) ? bestAsk : s.bestAsk,
            lastTickAt: Date.now(),
            cvd: s.cvd + sideDelta,
            status: "open",
          };
        });
      });

      ws.addEventListener("error", () => {
        setState((s) => ({ ...s, status: "error" }));
      });

      ws.addEventListener("close", () => {
        if (!closed) scheduleReconnect();
      });
    };

    const scheduleReconnect = () => {
      if (closed) return;
      attempt++;
      const backoff = Math.min(8000, 500 * 2 ** (attempt - 1));
      setState((s) => ({ ...s, status: "closed" }));
      reconnectTimer = setTimeout(connect, backoff);
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "unsubscribe",
                product_ids: [productId],
                channels: ["ticker"],
              }),
            );
          }
          ws.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, [productId]);

  return state;
}

interface RawTicker {
  type: string;
  product_id?: string;
  price?: string;
  best_bid?: string;
  best_ask?: string;
  last_size?: string;
  side?: "buy" | "sell";
  time?: string;
}

function initialState(status: ConnectionStatus = "idle"): LiveTickerState {
  return {
    data: [],
    value: null,
    bestBid: null,
    bestAsk: null,
    lastTickAt: null,
    cvd: 0,
    status,
  };
}

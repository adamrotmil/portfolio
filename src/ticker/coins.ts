// Sandbox coin metadata.  Each entry drives the segmented control and the
// data source.  The "Demo" segment uses the synthetic random-walk engine so
// the Pump/Dump + volatility controls remain meaningful; the real coins
// stream from Coinbase Exchange's public ticker feed.

export type CoinId = "BTC" | "ETH" | "SOL" | "DEMO";

export interface CoinMeta {
  id: CoinId;
  /** The pill label in the segmented control. */
  label: string;
  /** Big symbol rendered in the chart corner. */
  symbol: string;
  /** Coinbase Exchange product id (null for demo). */
  productId: string | null;
  /** Theme accent suggestion; overridden by the user's accent picker. */
  accent: string;
  /** Reasonable price precision for formatting. */
  decimals: number;
  /** A short one-liner shown under the chart when this coin is active. */
  caption: string;
}

export const COINS: Record<CoinId, CoinMeta> = {
  BTC: {
    id: "BTC",
    label: "BTC",
    symbol: "BTC",
    productId: "BTC-USD",
    accent: "#F7931A",
    decimals: 2,
    caption: "Bitcoin · spot vs USD · Coinbase Exchange",
  },
  ETH: {
    id: "ETH",
    label: "ETH",
    symbol: "ETH",
    productId: "ETH-USD",
    accent: "#627EEA",
    decimals: 2,
    caption: "Ether · spot vs USD · Coinbase Exchange",
  },
  SOL: {
    id: "SOL",
    label: "SOL",
    symbol: "SOL",
    productId: "SOL-USD",
    accent: "#14F195",
    decimals: 3,
    caption: "Solana · spot vs USD · Coinbase Exchange",
  },
  DEMO: {
    id: "DEMO",
    label: "Demo",
    symbol: "GMTRX",
    productId: null,
    accent: "#00D395",
    decimals: 2,
    caption: "Synthetic random walk — nudge it with Pump / Dump",
  },
};

export const COIN_ORDER: CoinId[] = ["BTC", "ETH", "SOL", "DEMO"];

export function isLive(id: CoinId): boolean {
  return id !== "DEMO";
}

export function formatPrice(value: number, decimals: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

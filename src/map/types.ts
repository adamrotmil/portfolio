// Restaurant seed data for the Table lab.
//
// Data is intentionally hand-curated, not pulled from an API —  that
// way the tile can tell a specific curator's story ("the 14 places
// I'd send a friend to in NYC this year") instead of a generic
// scrape, and we don't tie the sandbox to a key or billing provider.

export interface Source {
  /** The publication / guide doing the recommending. */
  name: string;
  /** Direct link to the relevant list or review. */
  url?: string;
  /** Short badge text, if different from name (e.g. "NYT · Best of 2024"). */
  badge?: string;
}

export interface Restaurant {
  id: string;
  name: string;

  /** Short editorial blurb — 1-2 sentences, written for the card. */
  blurb: string;

  /** Primary cuisine labels.  First one is the headline. */
  cuisine: string[];

  /** 1 = $ (under $25 pp), 2 = $$, 3 = $$$, 4 = $$$$ (tasting-menu tier). */
  price: 1 | 2 | 3 | 4;

  /** Typical approximate check per person, USD.  Used on the pin. */
  avgCheck: number;

  /** Aggregate rating from the curator's combined sources (0-5). */
  rating: number;

  /** Neighborhood label — used for filtering and on the card. */
  neighborhood: string;

  /** Full street address, readable. */
  address: string;

  /** Location for the map pin. */
  lat: number;
  lng: number;

  /** Relative path under /public (we prefix with assetPath at use). */
  photo: string;

  /** Short flavor tags — 2-4 each.  Fuel the filter chips. */
  tags: string[];

  /** Why a curator should care. */
  sources: Source[];

  /** Nearest NYC DOT public traffic camera — renders as the live
   *  "CCTV" tile on the target dossier.  Distance quoted in feet to
   *  keep the chrome honest (these are street cams, not interior). */
  camera?: {
    id: string;
    name: string;
    distanceFt: number;
    lat: number;
    lng: number;
  };
}

/** A "city" in the seed data — lets us add more cities later without
 *  restructuring. */
export interface City {
  id: string;
  label: string;
  /** Map center + initial zoom. */
  center: [number, number];
  zoom: number;
  restaurants: Restaurant[];
}

// ---- Helpers used by the UI ----

export function formatPrice(price: Restaurant["price"]): string {
  return "$".repeat(price);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

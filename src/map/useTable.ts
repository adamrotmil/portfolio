"use client";

import { useCallback, useMemo, useState } from "react";
import { NYC } from "./data/nyc";
import type { City, Restaurant } from "./types";

// State orchestrator for the Table lab.  Holds all the UI selection /
// filter / search state in one place so the modal shell can wire the
// list and map against a single source of truth.
//
// Filter philosophy: very light.  Price and cuisine are the two axes
// curious users actually turn, so those get chips; a free-text query
// searches across name, neighborhood, cuisine, and tags so someone
// typing "brunch" or "noodle" gets what they expect.

export type PriceFilter = 0 | 1 | 2 | 3 | 4;   // 0 = any

export interface TableState {
  city: City;
  query: string;
  price: PriceFilter;
  cuisine: string | null;
  filtered: Restaurant[];
  allCuisines: string[];
  hoveredId: string | null;
  selectedId: string | null;
  setQuery: (q: string) => void;
  setPrice: (p: PriceFilter) => void;
  setCuisine: (c: string | null) => void;
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  clearFilters: () => void;
}

export function useTable(): TableState {
  const city = NYC;
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<PriceFilter>(0);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allCuisines = useMemo(() => {
    const set = new Set<string>();
    for (const r of city.restaurants) for (const c of r.cuisine) set.add(c);
    return Array.from(set).sort();
  }, [city]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return city.restaurants.filter((r) => {
      if (price !== 0 && r.price !== price) return false;
      if (cuisine && !r.cuisine.includes(cuisine)) return false;
      if (!q) return true;
      const hay = [
        r.name,
        r.neighborhood,
        r.address,
        ...r.cuisine,
        ...r.tags,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [city, query, price, cuisine]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setPrice(0);
    setCuisine(null);
  }, []);

  return {
    city,
    query,
    price,
    cuisine,
    filtered,
    allCuisines,
    hoveredId,
    selectedId,
    setQuery,
    setPrice,
    setCuisine,
    setHoveredId,
    setSelectedId,
    clearFilters,
  };
}

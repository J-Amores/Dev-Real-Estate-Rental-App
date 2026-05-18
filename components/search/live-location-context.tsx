"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  query: string;
  setQuery: (value: string) => void;
};

const LiveLocationCtx = createContext<Ctx | null>(null);

export function LiveLocationProvider({
  initial = "",
  children,
}: {
  initial?: string;
  children: ReactNode;
}) {
  const [query, setQuery] = useState(initial);
  return (
    <LiveLocationCtx.Provider value={{ query, setQuery }}>
      {children}
    </LiveLocationCtx.Provider>
  );
}

// Falls back to an empty query when the provider is absent so consumers
// rendered outside /search (or in storybook-style smoke) degrade to "match all".
export function useLiveLocation(): Ctx {
  const ctx = useContext(LiveLocationCtx);
  if (!ctx) return { query: "", setQuery: () => {} };
  return ctx;
}

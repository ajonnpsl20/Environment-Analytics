"use client";

import { useState } from "react";

// Shared legend-highlight behaviour for the Bar/Line chart wrappers. Hovering a
// legend item highlights that series (dims the rest); clicking pins it so it
// stays highlighted after the pointer leaves (click again to unpin). Hover wins
// over the pinned selection while the pointer is over an item.

export type SeriesHighlight = {
  activeKey: string | null;
  pinnedKey: string | null;
  isDimmed: (key: string) => boolean;
  setHovered: (key: string | null) => void;
  togglePinned: (key: string) => void;
};

export function useSeriesHighlight(): SeriesHighlight {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const activeKey = hovered ?? pinned;
  return {
    activeKey,
    pinnedKey: pinned,
    isDimmed: (key) => activeKey !== null && activeKey !== key,
    setHovered,
    togglePinned: (key) => setPinned((p) => (p === key ? null : key)),
  };
}

// Rendered via Recharts' <Legend content={...} />. Recharts injects extra props
// at runtime; we ignore them and render from the series we already hold.
export function InteractiveLegend({
  series,
  colorFor,
  highlight,
}: {
  series: { key: string; label: string }[];
  colorFor: (i: number) => string;
  highlight: SeriesHighlight;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-[0.8125rem]">
      {series.map((s, i) => {
        const dimmed = highlight.isDimmed(s.key);
        const pinned = highlight.pinnedKey === s.key;
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={pinned}
            onMouseEnter={() => highlight.setHovered(s.key)}
            onMouseLeave={() => highlight.setHovered(null)}
            onClick={() => highlight.togglePinned(s.key)}
            className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition-opacity hover:bg-muted/40"
            style={{ opacity: dimmed ? 0.4 : 1 }}
          >
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ background: colorFor(i) }}
            />
            <span
              className={
                pinned
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

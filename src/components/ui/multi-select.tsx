"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export type MultiSelectOption = { value: string; label: string };

// Checkbox-style multi-select built on Popover (no checkbox/command primitives in
// the kit). Empty selection means "all" — the caller drops the filter entirely.
// Selecting toggles values in/out; the popup stays open for multiple picks.
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  className,
}: {
  /** Lower-cased in the "All {label}" summary, e.g. "sites", "pollutants". */
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const selectedSet = new Set(selected);

  function toggle(value: string) {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    // Emit in the options' own order for stable, readable URLs.
    onChange(options.filter((o) => next.has(o.value)).map((o) => o.value));
  }

  const summary =
    selected.length === 0
      ? `All ${label.toLowerCase()}`
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? "1 selected")
        : `${selected.length} selected`;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-normal shadow-xs outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30",
          className,
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1">
        <div className="max-h-72 overflow-auto">
          {options.map((o) => {
            const active = selectedSet.has(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input",
                  )}
                >
                  {active && <Check className="size-3" />}
                </span>
                <span className="truncate">{o.label}</span>
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent"
          >
            Clear selection
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

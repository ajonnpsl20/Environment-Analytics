"use client";

import "react-day-picker/style.css";
import * as React from "react";
import { DayPicker, type DropdownProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Theme react-day-picker via its CSS custom properties so selected/today colours
// match the app palette (the base layout comes from react-day-picker/style.css).
const THEME_VARS = {
  "--rdp-accent-color": "var(--color-primary)",
  "--rdp-accent-background-color": "var(--color-accent)",
  "--rdp-today-color": "var(--color-primary)",
} as React.CSSProperties;

// A single, shadcn-styled <select> for the month/year caption dropdowns. Replaces
// react-day-picker's default Dropdown (an invisible <select> overlaid on a visible
// label span) — rendering one element avoids the value showing twice. The matching
// `caption_label: "sr-only"` className hides the now-redundant label.
function CalendarDropdown({ options, className, ...props }: DropdownProps) {
  return (
    <select className={className} {...props}>
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 text-sm", className)}
      style={THEME_VARS}
      // Month + year dropdowns so any date is reachable in a couple of clicks
      // instead of stepping month-by-month. Range is bounded (2015 → next year)
      // because v10 otherwise defaults the year dropdown to 100 years back.
      captionLayout="dropdown"
      startMonth={new Date(2015, 0, 1)}
      endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
      reverseYears
      navLayout="after"
      classNames={{
        dropdowns: "flex items-center gap-1.5",
        dropdown_root: "relative",
        dropdown:
          "h-8 cursor-pointer rounded-md border border-input bg-transparent px-2 text-sm font-medium outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30",
        // The default label duplicates the custom <select>'s value — hide it
        // visually but keep it in the DOM for screen readers.
        caption_label: "sr-only",
      }}
      components={{
        Dropdown: CalendarDropdown,
        Chevron: ({ orientation, className: chevronClass }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClass)} />
          ) : (
            <ChevronRight className={cn("size-4", chevronClass)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };

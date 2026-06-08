"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format, parse, isValid } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// Value contract: `yyyy-MM-dd` strings in and out (drop-in for the native date
// inputs used by filters [URL params] and forms [RHF + zod string schemas]).
const WIRE_FORMAT = "yyyy-MM-dd";

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, WIRE_FORMAT, new Date());
  return isValid(d) ? d : undefined;
}

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Show an inline clear (×) that emits "" — handy for optional filters. */
  clearable?: boolean;
} & Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "color"
>;

// forwardRef so it can sit inside a React-Hook-Form <FormControl> (a Radix Slot
// that forwards a ref) without the "function components can't take refs" warning.
export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(
    {
      value,
      onChange,
      placeholder = "Pick a date",
      disabled,
      className,
      clearable = false,
      ...rest
    },
    ref,
  ) {
    const [open, setOpen] = React.useState(false);
    const selected = parseValue(value);
    const showClear = clearable && !!selected && !disabled;

    return (
      <div ref={ref} className={cn("relative", className)} {...rest}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start gap-2 font-normal",
                !selected && "text-muted-foreground",
                showClear && "pr-8",
              )}
            >
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {selected ? format(selected, "d MMM yyyy") : placeholder}
              </span>
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              onChange(d ? format(d, WIRE_FORMAT) : "");
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {showClear && (
        <button
          type="button"
          aria-label="Clear date"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1.5 z-10 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
      </div>
    );
  },
);

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";

export type SiteOption = { id: string; name: string };

const FILTER_KEYS = ["from", "to", "site"] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function GasFilters({ sites }: { sites: SiteOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value?: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.replace(next.toString() ? `${pathname}?${next}` : pathname);
  }

  function setMulti(key: string, values: string[]) {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    values.forEach((v) => next.append(key, v));
    router.replace(next.toString() ? `${pathname}?${next}` : pathname);
  }

  const hasFilters = FILTER_KEYS.some((k) => params.getAll(k).length > 0);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <Field label="From">
        <DatePicker
          className="w-40"
          placeholder="Any"
          clearable
          value={params.get("from") ?? ""}
          onChange={(v) => setParam("from", v)}
        />
      </Field>

      <Field label="To">
        <DatePicker
          className="w-40"
          placeholder="Any"
          clearable
          value={params.get("to") ?? ""}
          onChange={(v) => setParam("to", v)}
        />
      </Field>

      <Field label="Site">
        <MultiSelect
          className="w-52"
          label="sites"
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
          selected={params.getAll("site")}
          onChange={(v) => setMulti("site", v)}
        />
      </Field>

      {hasFilters && (
        <Button variant="ghost" onClick={() => router.replace(pathname)}>
          Clear
        </Button>
      )}
    </div>
  );
}

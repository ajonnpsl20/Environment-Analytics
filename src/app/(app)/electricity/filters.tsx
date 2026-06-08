"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPLIERS } from "@/lib/validations/electricity";
import { RECORD_STATUSES, STATUS_LABEL } from "@/lib/record-status";

export type SiteOption = { id: string; name: string };

const ALL = "all";
const FILTER_KEYS = ["from", "to", "site", "supplier", "status"] as const;

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

export function ElectricityFilters({ sites }: { sites: SiteOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value?: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    router.replace(next.toString() ? `${pathname}?${next}` : pathname);
  }

  const hasFilters = FILTER_KEYS.some((k) => params.get(k));

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
        <Select
          value={params.get("site") ?? ALL}
          onValueChange={(v) => setParam("site", v)}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sites</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Supplier">
        <Select
          value={params.get("supplier") ?? ALL}
          onValueChange={(v) => setParam("supplier", v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All suppliers</SelectItem>
            {SUPPLIERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Status">
        <Select
          value={params.get("status") ?? ALL}
          onValueChange={(v) => setParam("status", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {RECORD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {hasFilters && (
        <Button variant="ghost" onClick={() => router.replace(pathname)}>
          Clear
        </Button>
      )}
    </div>
  );
}

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit-constants";

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

export function AuditFilters({
  users,
}: {
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value?: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.replace(next.toString() ? `${pathname}?${next}` : pathname);
  }

  function setMulti(key: string, values: string[]) {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    values.forEach((v) => next.append(key, v));
    next.delete("page");
    router.replace(next.toString() ? `${pathname}?${next}` : pathname);
  }

  const hasFilters = ["action", "entityType", "user", "from", "to"].some(
    (k) => params.getAll(k).length > 0,
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <Field label="Action">
        <MultiSelect
          className="w-40"
          label="actions"
          options={AUDIT_ACTIONS.map((a) => ({ value: a, label: a }))}
          selected={params.getAll("action")}
          onChange={(v) => setMulti("action", v)}
        />
      </Field>

      <Field label="Entity">
        <MultiSelect
          className="w-44"
          label="entities"
          options={AUDIT_ENTITY_TYPES.map((e) => ({ value: e, label: e }))}
          selected={params.getAll("entityType")}
          onChange={(v) => setMulti("entityType", v)}
        />
      </Field>

      <Field label="User">
        <MultiSelect
          className="w-44"
          label="users"
          options={users.map((u) => ({ value: u.id, label: u.name }))}
          selected={params.getAll("user")}
          onChange={(v) => setMulti("user", v)}
        />
      </Field>

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

      {hasFilters && (
        <Button variant="ghost" onClick={() => router.replace(pathname)}>
          Clear
        </Button>
      )}
    </div>
  );
}

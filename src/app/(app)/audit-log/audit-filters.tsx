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
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit-constants";

const ALL = "all";

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
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.replace(next.toString() ? `${pathname}?${next}` : pathname);
  }

  const hasFilters = ["action", "entityType", "user", "from", "to"].some((k) =>
    params.get(k),
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <Field label="Action">
        <Select
          value={params.get("action") ?? ALL}
          onValueChange={(v) => setParam("action", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Entity">
        <Select
          value={params.get("entityType") ?? ALL}
          onValueChange={(v) => setParam("entityType", v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All entities</SelectItem>
            {AUDIT_ENTITY_TYPES.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="User">
        <Select
          value={params.get("user") ?? ALL}
          onValueChange={(v) => setParam("user", v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

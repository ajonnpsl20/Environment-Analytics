import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export const ROLE_LABELS: Record<Role, string> = {
  SystemAdmin: "System Admin",
  SiteAdmin: "Site Admin",
  DataEntryUser: "Data Entry",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="secondary" className="font-medium">
      {ROLE_LABELS[role]}
    </Badge>
  );
}

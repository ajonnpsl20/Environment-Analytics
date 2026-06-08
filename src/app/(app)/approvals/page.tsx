import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listPendingForUser } from "@/lib/approvals/engine";
import { AccessDenied } from "@/components/layout/access-denied";
import { ApprovalsClient } from "./approvals-client";

export const metadata: Metadata = { title: "Approvals" };
export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "approve_records")) {
    return <AccessDenied />;
  }

  const queues = await listPendingForUser({
    id: session.user.id,
    role: session.user.role,
  });

  const total = queues.reduce((sum, q) => sum + q.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Approvals
        </h2>
        <p className="text-sm text-muted-foreground">
          {total > 0
            ? `${total} record${total === 1 ? "" : "s"} awaiting review across the sites you manage.`
            : "Review submitted records for the sites you manage."}
        </p>
      </div>

      <ApprovalsClient queues={queues} />
    </div>
  );
}

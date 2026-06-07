import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { AccessDenied } from "@/components/layout/access-denied";
import { SitesClient } from "./sites-client";

export const metadata: Metadata = { title: "Sites" };
export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manage_sites")) {
    return <AccessDenied />;
  }

  const sites = await db.site.findMany({ orderBy: { siteId: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Sites
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage the facilities tracked in EnviroHub.
        </p>
      </div>
      <SitesClient sites={sites} />
    </div>
  );
}

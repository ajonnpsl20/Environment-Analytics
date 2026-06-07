"use client";

import { useState, useTransition } from "react";
import type { Site } from "@prisma/client";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/tables/data-table";
import { SiteForm } from "@/components/data-entry/site-form";
import type { SiteFormValues } from "@/lib/validations/site";
import { getSiteColumns } from "./columns";
import { createSiteAction, updateSiteAction, deleteSiteAction } from "./actions";

function toFormValues(s: Site): SiteFormValues {
  return {
    siteId: s.siteId,
    name: s.name,
    address: s.address,
    country: s.country,
    operationalType: s.operationalType,
    latitude: s.latitude != null ? String(s.latitude) : "",
    longitude: s.longitude != null ? String(s.longitude) : "",
  };
}

export function SitesClient({ sites }: { sites: Site[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [deleteSite, setDeleteSite] = useState<Site | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = getSiteColumns({
    onEdit: setEditSite,
    onDelete: setDeleteSite,
  });

  function confirmDelete() {
    if (!deleteSite) return;
    startTransition(async () => {
      const res = await deleteSiteAction(deleteSite.id);
      if (res.ok) {
        toast.success("Site deleted");
        setDeleteSite(null);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={sites}
        emptyMessage="No sites yet. Add your first facility."
        toolbar={
          <div className="flex justify-end">
            <Button onClick={() => setAddOpen(true)}>
              <Plus />
              Add site
            </Button>
          </div>
        }
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add site</DialogTitle>
            <DialogDescription>Create a new facility.</DialogDescription>
          </DialogHeader>
          <SiteForm
            onSubmit={createSiteAction}
            onSuccess={() => setAddOpen(false)}
            submitLabel="Create site"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editSite}
        onOpenChange={(open) => !open && setEditSite(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit site</DialogTitle>
            <DialogDescription>Update facility details.</DialogDescription>
          </DialogHeader>
          {editSite && (
            <SiteForm
              defaultValues={toFormValues(editSite)}
              onSubmit={(values) => updateSiteAction(editSite.id, values)}
              onSuccess={() => setEditSite(null)}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteSite}
        onOpenChange={(open) => !open && setDeleteSite(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete site</DialogTitle>
            <DialogDescription>
              {deleteSite
                ? `Delete "${deleteSite.name}"? This action cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteSite(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              Delete site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

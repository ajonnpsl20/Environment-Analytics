import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-semibold">Access denied</h2>
          <p className="text-sm text-muted-foreground">
            {message ?? "You don't have permission to view this page."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

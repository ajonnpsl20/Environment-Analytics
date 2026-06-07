"use client";

import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { titleForPath } from "@/components/layout/nav-items";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader({
  user,
}: {
  user: { name: string; email: string; role: Role };
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-5" />
      <h1 className="font-heading text-base font-semibold tracking-tight">
        {titleForPath(pathname)}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <UserMenu name={user.name} email={user.email} role={user.role} />
      </div>
    </header>
  );
}

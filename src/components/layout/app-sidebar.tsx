"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

import { can } from "@/lib/permissions";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => !i.action || can(role, i.action));

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Logo className="px-1 [&_span]:text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              if (!item.available) {
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      disabled
                      className="cursor-not-allowed opacity-50"
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>Soon</SidebarMenuBadge>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <Icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <p className="px-1 text-xs text-sidebar-foreground/50">
          EnviroHub PoC · Demo
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

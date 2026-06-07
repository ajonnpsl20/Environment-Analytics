import {
  LayoutDashboard,
  Building2,
  Wind,
  Trash2,
  Droplets,
  Zap,
  ClipboardCheck,
  Plug,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { Action } from "@/lib/permissions";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Permission needed to see this item; undefined = visible to all signed-in users. */
  action?: Action;
  /** Whether the destination is built yet (Phase 1). Unbuilt items render disabled. */
  available: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, available: true },
  { title: "Sites", href: "/sites", icon: Building2, action: "manage_sites", available: true },
  { title: "Air Emissions", href: "/air-emissions", icon: Wind, action: "enter_data", available: false },
  { title: "Waste", href: "/waste", icon: Trash2, action: "enter_data", available: false },
  { title: "Water", href: "/water", icon: Droplets, action: "enter_data", available: false },
  { title: "Electricity", href: "/electricity", icon: Zap, action: "enter_data", available: false },
  { title: "Approvals", href: "/approvals", icon: ClipboardCheck, action: "approve_records", available: false },
  { title: "Connectors", href: "/connectors", icon: Plug, action: "run_connector", available: false },
  { title: "Audit Log", href: "/audit-log", icon: ScrollText, action: "view_audit_log", available: true },
];

/** Human-readable page title for a pathname (used by the header). */
export function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  return match?.title ?? "EnviroHub";
}

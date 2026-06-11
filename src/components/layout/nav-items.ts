import {
  Building2,
  Wind,
  Trash2,
  Droplets,
  Zap,
  Flame,
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
  { title: "Sites", href: "/sites", icon: Building2, action: "manage_sites", available: true },
  { title: "Air Emissions", href: "/air-emissions", icon: Wind, action: "enter_data", available: true },
  { title: "Waste", href: "/waste", icon: Trash2, action: "enter_data", available: true },
  { title: "Water", href: "/water", icon: Droplets, action: "enter_data", available: true },
  { title: "Electricity", href: "/electricity", icon: Zap, action: "enter_data", available: true },
  { title: "Gas", href: "/gas", icon: Flame, action: "enter_data", available: true },
  { title: "Connectors", href: "/connectors", icon: Plug, action: "run_connector", available: true },
  { title: "Data Entry Log", href: "/audit-log", icon: ScrollText, action: "view_audit_log", available: true },
];

/** Human-readable page title for a pathname (used by the header). */
export function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  return match?.title ?? "EnviroHub";
}

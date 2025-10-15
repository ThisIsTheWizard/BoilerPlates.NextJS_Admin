import type { LucideIcon } from "lucide-react";
import { Gauge, KeySquare, ShieldCheck, Users } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Gauge,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Roles",
    href: "/roles",
    icon: ShieldCheck,
  },
  {
    title: "Permissions",
    href: "/permissions",
    icon: KeySquare,
  },
];

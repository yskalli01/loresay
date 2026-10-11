import {
  Bot,
  Database,
  Folder,
  LayoutDashboard,
  Search,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  status?: "current" | "planned";
};

export const navigationItems: NavigationItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", status: "current" },
  { href: "/sources", icon: Database, label: "Sources", status: "current" },
  {
    href: "/collections",
    icon: Folder,
    label: "Collections",
    status: "current",
  },
  { href: "/chat", icon: Bot, label: "Chat", status: "current" },
  { href: "/search", icon: Search, label: "Search", status: "current" },
];

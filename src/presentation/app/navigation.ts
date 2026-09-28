import {
  Bot,
  Database,
  LayoutDashboard,
  Link2,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  status?: "current" | "planned";
};

export const navigationItems: NavigationItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Overview", status: "current" },
  { href: "/notes", icon: StickyNote, label: "Notes", status: "current" },
  { href: "/ingestion", icon: Link2, label: "Ingestion", status: "current" },
  { href: "/chat", icon: Bot, label: "Chat with AI", status: "current" },
  { href: "/sources", icon: Database, label: "Sources", status: "current" },
];

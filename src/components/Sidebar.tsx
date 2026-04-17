"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Star, Settings, Radar, UserCircle, TrendingUp, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/favorites", label: "Favoritos", icon: Star },
  { href: "/earnings", label: "Ganancias", icon: TrendingUp },
  { href: "/profile", label: "Perfil", icon: UserCircle },
  { href: "/settings", label: "Configuración", icon: Settings },
];

function ThemeToggle(): React.ReactElement {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center size-7 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      aria-label="Toggle theme"
    >
      <Sun className="size-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-7 rounded-lg bg-primary/20">
            <Radar className="size-4 text-primary" />
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground tracking-wide">FreelanceRadar</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        <p className="text-xs font-medium text-sidebar-foreground/30 uppercase tracking-widest px-3 py-2">Menu</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
          <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <UserCircle className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">FreelanceRadar</p>
            <p className="text-xs text-sidebar-foreground/40 truncate">v3.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

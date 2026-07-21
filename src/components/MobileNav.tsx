"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Smartphone,
  History,
  User,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  { href: "/mobile", label: "Accueil", icon: Home },
  { href: "/mobile/scan", label: "Scan", icon: Smartphone },
  { href: "/mobile/history", label: "Historique", icon: History },
  { href: "/mobile/profile", label: "Profil", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
      <div className="max-w-md mx-auto flex items-center justify-around py-3 px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors ${
                active
                  ? "text-accent-blue"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-accent-blue font-semibold uppercase tracking-wider">
            Flliter Mobile
          </p>
          <h1 className="text-2xl font-bold mt-1">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <Link
          href="/dashboard"
          className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
          title="Dashboard"
        >
          <LayoutDashboard size={20} className="text-accent-blue" />
        </Link>
      </div>
    </header>
  );
}

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary pb-24 max-w-md mx-auto relative">
      {children}
      <MobileNav />
    </div>
  );
}

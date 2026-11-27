"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  Building2,
  Compass,
  KeyRound,
  LogOut,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { LegalLinks } from "@/components/legal-links";
import { createClient } from "@/lib/supabase/client";
import { clearSessionToken } from "@/lib/device";
import type { ActivePassSummary } from "@/types/property";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  userRole?: string | null;
  activePasses?: ActivePassSummary[];
  revealsUsedToday?: number;
}

export function AppShell({
  children,
  userEmail,
  userRole,
  activePasses = [],
  revealsUsedToday = 0,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const remainingToday = Math.max(0, 7 - revealsUsedToday);

  const handleSignOut = async () => {
    const supabase = createClient();
    clearSessionToken();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/", label: "Explore", icon: Compass },
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/my-unlocks", label: "My Unlocks", icon: KeyRound },
    ...(userRole === "admin"
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : userRole === "manager"
      ? [{ href: "/manager", label: "Manager", icon: Building2 }]
      : !userEmail
      ? [{ href: "/login", label: "Sign In", icon: User }]
      : []),
  ];

  const isNavItemActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-canvas pb-24 text-ink md:pb-10">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b border-subtle bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          {/* Brand + Active Area */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-lg font-extrabold tracking-tight sm:text-xl"
            >
              propertyaccess<span className="text-emerald-brand">.ke</span>
            </Link>
            <span className="hidden items-center gap-1 rounded-full border border-subtle bg-card px-2.5 py-1 text-xs font-medium text-ink-secondary sm:inline-flex">
              <MapPin className="h-3.5 w-3.5 text-emerald-brand" />
              Nairobi &amp; Kiambu
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => {
              const isActive = isNavItemActive(item.href);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`text-xs font-bold transition ${
                    isActive
                      ? "text-emerald-brand"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: 7-Day Pass Pill + Theme Switcher + Sign Out */}
          <div className="flex items-center gap-2">
            {activePasses.length > 0 ? (
              <Link
                href="/my-unlocks"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-brand/40 bg-emerald-brand/10 px-3 py-1.5 text-[11px] font-bold text-emerald-brand"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {activePasses.length} Pass Active • {remainingToday}/7 left
                </span>
              </Link>
            ) : (
              <Link
                href="/my-unlocks"
                className="hidden items-center gap-1 rounded-full border border-subtle bg-card px-3 py-1.5 text-[11px] font-semibold text-ink-secondary hover:border-emerald-brand sm:inline-flex"
              >
                <KeyRound className="h-3 w-3 text-emerald-brand" />
                <span>7-Day Pass: KES 200</span>
              </Link>
            )}

            {userEmail && <NotificationBell />}

            <ThemeToggle />

            {userEmail && (
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-subtle bg-card text-ink-secondary transition hover:border-danger hover:text-danger"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 pt-5">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-6">
        <LegalLinks />
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-subtle bg-card/95 px-2 py-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item.href);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[11px] font-bold transition ${
                  isActive
                    ? "text-emerald-brand"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

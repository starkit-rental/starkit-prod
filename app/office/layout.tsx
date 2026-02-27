"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Settings,
  LogOut,
  FileText,
  Users,
  Mail,
  PlusCircle,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: null,
    items: [
      { href: "/office/dashboard", label: "Pulpit", icon: LayoutDashboard },
    ],
  },
  {
    label: "Wynajem",
    items: [
      { href: "/office/orders", label: "Zamówienia", icon: ShoppingCart },
      { href: "/office/customers", label: "Klienci", icon: Users },
      { href: "/office/inventory", label: "Magazyn", icon: Boxes },
    ],
  },
  {
    label: "Ustawienia",
    items: [
      { href: "/office/settings/pricing", label: "Cennik", icon: Settings },
      { href: "/office/settings/contract", label: "Umowa", icon: FileText },
      { href: "/office/settings/emails", label: "E-maile", icon: Mail },
    ],
  },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/office/dashboard") return pathname === href;
    if (href === "/office/orders") return pathname === href || (pathname?.startsWith("/office/orders") && !pathname?.startsWith("/office/orders/new"));
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <Link href="/office" className="flex items-center" onClick={onClose}>
          <Image src="/logo.png" alt="Starkit" width={100} height={36} className="object-contain" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New Order CTA */}
      <div className="px-3 pt-3 pb-2">
        <Link
          href="/office/orders/new"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Nowe zamówienie
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label ?? "top"}>
            {group.label && (
              <div className="px-3 pb-1 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {group.label}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 px-3 py-3">
        <form action="/office/logout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 h-9 px-3 text-sm"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Wyloguj
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pageTitle = (() => {
    if (pathname === "/office/dashboard") return "Pulpit";
    if (pathname?.startsWith("/office/orders/new")) return "Nowe zamówienie";
    if (pathname?.match(/\/office\/orders\/[^/]+$/)) return "Szczegóły zamówienia";
    if (pathname?.startsWith("/office/orders")) return "Zamówienia";
    if (pathname?.startsWith("/office/customers")) return "Klienci";
    if (pathname?.startsWith("/office/inventory")) return "Magazyn";
    if (pathname?.startsWith("/office/settings/pricing")) return "Cennik";
    if (pathname?.startsWith("/office/settings/contract")) return "Umowa";
    if (pathname?.startsWith("/office/settings/emails")) return "E-maile";
    return "Panel";
  })();

  // The emails page has its own internal header/layout, skip the page wrapper padding for it
  const isEmailsPage = pathname?.startsWith("/office/settings/emails");
  const isLoginPage = pathname === "/office/login";

  if (isLoginPage) {
    return (
      <div className="office-light min-h-screen bg-slate-50 flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    // Force light mode: office-light resets all CSS vars to light values, overriding .dark on <html>
    <div className="office-light flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-64 flex-col shadow-2xl">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden"
              aria-label="Otwórz menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-900">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/office/orders/new"
              className="hidden sm:flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Nowe zamówienie
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {isEmailsPage ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

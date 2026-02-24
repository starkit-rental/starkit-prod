import Link from "next/link";
import { LayoutDashboard, ShoppingCart, Boxes, Settings, LogOut, FileText, Users, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/office" className="text-base font-bold tracking-tight text-slate-900">
              Starkit <span className="text-slate-400 font-normal text-sm">Office</span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/office/dashboard"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4 text-slate-400" />
                Dashboard
              </Link>
              <Link
                href="/office/orders"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <ShoppingCart className="h-4 w-4 text-slate-400" />
                Zamówienia
              </Link>
              <Link
                href="/office/customers"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Users className="h-4 w-4 text-slate-400" />
                Klienci
              </Link>
              <Link
                href="/office/inventory"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Boxes className="h-4 w-4 text-slate-400" />
                Inventory
              </Link>
              <Link
                href="/office/settings/pricing"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Pricing
              </Link>
              <Link
                href="/office/settings/contract"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Umowa
              </Link>
              <Link
                href="/office/settings/emails"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                E-maile
              </Link>
            </nav>
          </div>

          <form action="/office/logout" method="post">
            <Button type="submit" variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-900">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Wyloguj</span>
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}

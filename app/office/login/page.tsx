"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/office/dashboard";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm px-4">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <img src="/logo.png" alt="Starkit" className="h-10 object-contain" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Zaloguj się</h1>
        <p className="text-sm text-slate-500 mb-6">Panel zarządzania Starkit</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
              placeholder="admin@starkit.pl"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hasło</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-10"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold mt-1">
            {loading ? "Logowanie…" : "Zaloguj się"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function OfficeLoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm pt-12 text-center">Ładowanie...</div>}>
      <LoginContent />
    </Suspense>
  );
}

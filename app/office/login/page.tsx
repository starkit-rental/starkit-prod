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
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 pt-12">
      <div>
        <h1 className="text-lg font-semibold">Logowanie</h1>
        <p className="text-sm text-muted-foreground">Dostęp do panelu /office</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Hasło</label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <Button type="submit" disabled={loading}>
          {loading ? "Logowanie..." : "Zaloguj"}
        </Button>
      </form>
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

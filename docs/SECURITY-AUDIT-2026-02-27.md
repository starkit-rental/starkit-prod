# Audyt Bezpieczeństwa - Starkit System
**Data:** 27 lutego 2026  
**Status:** KRYTYCZNE problemy wykryte - NIE WDRAŻAĆ NA PRODUKCJĘ bez poprawek

---

## 🔴 KRYTYCZNE (P0) - Muszą być naprawione przed produkcją

### 1. BRAK AUTORYZACJI W API `/api/office/*`
**Ryzyko:** KRYTYCZNE  
**Impact:** Każdy może wywołać wrażliwe endpointy administracyjne bez logowania

**Problem:**
- Middleware (`middleware.ts`) chroni tylko strony `/office/*`, NIE chroni API routes
- Wszystkie endpointy `/api/office/*` są dostępne publicznie:
  - `/api/office/delete-customer` - usuwa klientów
  - `/api/office/send-email` - wysyła emaile w imieniu firmy
  - `/api/office/order-payment` - zmienia statusy płatności
  - `/api/office/send-invoice` - wysyła faktury
  - `/api/office/contract-pdf` - dostęp do PDF umów
  - ... i 10+ innych wrażliwych endpointów

**Weryfikacja:**
```bash
# Dowolny użytkownik może wykonać:
curl -X POST https://twoja-domena.com/api/office/delete-customer \
  -H "Content-Type: application/json" \
  -d '{"customerId":"uuid-klienta"}'
```

**Rozwiązanie:**
Dodać funkcję weryfikacji użytkownika w każdym endpoincie `/api/office/*`:

```typescript
// lib/auth-guard.ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function requireAuth(req: NextRequest) {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, supabase };
}
```

Użycie w każdym endpoincie:
```typescript
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth; // błąd autoryzacji
  
  const { user, supabase } = auth;
  // ... reszta logiki
}
```

**Priorytet:** P0 - NATYCHMIAST

---

### 2. BRAK SECURITY HEADERS
**Ryzyko:** WYSOKIE  
**Impact:** XSS, Clickjacking, MIME sniffing attacks

**Problem:**
Brak nagłówków bezpieczeństwa w `next.config.mjs`:
- `X-Frame-Options` - brak ochrony przed clickjacking
- `Content-Security-Policy` - brak ochrony przed XSS
- `X-Content-Type-Options` - brak ochrony przed MIME sniffing
- `Strict-Transport-Security` - brak wymuszenia HTTPS
- `Referrer-Policy` - wyciek informacji w referrer

**Rozwiązanie:**
Dodać do `next.config.mjs`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://cdn.sanity.io",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co https://api.stripe.com",
            "frame-src 'self' https://js.stripe.com https://www.openstreetmap.org",
          ].join('; '),
        },
      ],
    },
  ];
},
```

**Priorytet:** P0

---

### 3. BRAK WALIDACJI DANYCH WEJŚCIOWYCH
**Ryzyko:** WYSOKIE  
**Impact:** SQL Injection, XSS, Data corruption

**Problem:**
- Większość API endpoints nie waliduje danych wejściowych (brak zod/yup)
- Przykład: `/api/office/send-email` - brak walidacji email, subject, body
- Przykład: `/api/office/order-payment` - brak walidacji UUID, wartości liczbowych

**Rozwiązanie:**
Dodać walidację Zod do wszystkich API endpoints:

```typescript
import { z } from "zod";

const sendEmailSchema = z.object({
  orderId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const rawBody = await req.json();
  const validation = sendEmailSchema.safeParse(rawBody);
  
  if (!validation.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: validation.error.format() 
    }, { status: 400 });
  }
  
  const { orderId, to, subject, body } = validation.data;
  // ... bezpieczna logika
}
```

**Priorytet:** P0

---

## 🟡 WYSOKIE (P1) - Powinny być naprawione przed produkcją

### 4. BRAK RATE LIMITING
**Ryzyko:** ŚREDNIE  
**Impact:** DoS attacks, brute force, nadmierne koszty API (Stripe, Resend)

**Problem:**
- Brak rate limiting na endpointach API
- Atakujący może wysłać tysiące requestów w sekundzie
- Szczególnie wrażliwe: `/api/create-checkout-session`, `/api/send-email`

**Rozwiązanie:**
Użyć middleware lub biblioteki `@upstash/ratelimit`:

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10s
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  return { success, limit, reset, remaining };
}
```

Użycie:
```typescript
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await checkRateLimit(ip);
  
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  // ... logika
}
```

**Priorytet:** P1

---

### 5. STRIPE WEBHOOK - Częściowo zabezpieczony
**Ryzyko:** NISKIE (obecna implementacja jest OK)  
**Rekomendacja:** Dodać logging i monitoring

**Status:** ✅ Weryfikacja podpisu jest poprawna  
**Ale:** Brak logowania podejrzanych prób, brak monitoringu

**Rozwiązanie:**
```typescript
// Dodać do /api/stripe-webhook/route.ts
try {
  event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
} catch (e) {
  const msg = e instanceof Error ? e.message : "Invalid signature";
  
  // LOG SECURITY EVENT
  console.error("[SECURITY] Invalid Stripe webhook signature attempt", {
    ip: req.headers.get("x-forwarded-for"),
    timestamp: new Date().toISOString(),
    error: msg,
  });
  
  return NextResponse.json({ error: msg }, { status: 400 });
}
```

**Priorytet:** P1

---

### 6. BRAK HTTPS ENFORCEMENT W KONFIGURACJI
**Ryzyko:** ŚREDNIE  
**Impact:** Man-in-the-middle attacks

**Problem:**
`next.config.mjs` ustawia `poweredByHeader: false` (OK), ale brak wymuszenia HTTPS

**Rozwiązanie:**
Dodać do `middleware.ts`:

```typescript
export async function middleware(request: NextRequest) {
  // Enforce HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get("host")}${request.nextUrl.pathname}`,
      301
    );
  }
  
  // ... reszta middleware
}
```

**Priorytet:** P1

---

## 🟢 ŚREDNIE (P2) - Dobre praktyki

### 7. .env.local - Upewnij się że nie jest w .git
**Status:** ✅ OK - `.env*.local` jest w `.gitignore`

**Rekomendacja:** Zweryfikuj historię git:
```bash
git log --all --full-history -- .env.local
```

**Priorytet:** P2 (weryfikacja)

---

### 8. SUPABASE RLS (Row Level Security)
**Ryzyko:** NISKIE (używasz service role key w API)  
**Rekomendacja:** Weryfikuj czy RLS policies są włączone

**Problem:**
API endpoints używają `SUPABASE_SERVICE_ROLE_KEY`, co **omija RLS**. To jest OK jeśli:
1. Endpointy mają własną autoryzację (zobacz P0 #1)
2. RLS jest włączone jako backup defense-in-depth

**Weryfikacja w Supabase Dashboard:**
```sql
-- Sprawdź czy RLS jest włączone
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Powinno być: rowsecurity = true
```

**Priorytet:** P2

---

### 9. LOGGING I MONITORING
**Ryzyko:** NISKIE  
**Impact:** Trudność w wykrywaniu ataków

**Rekomendacja:**
- Dodać structured logging (np. Pino, Winston)
- Monitorować failed login attempts
- Alertować na nietypową aktywność (np. 100+ requestów w minutę)
- Integracja z Sentry lub Datadog

**Priorytet:** P2

---

### 10. SECRETS ROTATION
**Rekomendacja:** Plan rotacji kluczy API

**Co rotować co 90 dni:**
- `STRIPE_SECRET_KEY` (w Stripe Dashboard)
- `RESEND_API_KEY` (w Resend)
- `SUPABASE_SERVICE_ROLE_KEY` (w Supabase Dashboard)
- `STRIPE_WEBHOOK_SECRET` (po zmianie trzeba zaktualizować webhook)

**Priorytet:** P2

---

## ✅ Co jest OK

1. ✅ **Brak commitowanych sekretów** - zweryfikowano historię git
2. ✅ **Stripe webhook** - ma weryfikację podpisu
3. ✅ `.gitignore` - poprawnie skonfigurowany
4. ✅ `poweredByHeader: false` - ukrywa Next.js version
5. ✅ Supabase connection - używa environment variables

---

## 📋 CHECKLIST przed produkcją

### Must-have (BLOKUJĄCE):
- [ ] **P0 #1:** Dodać autoryzację do wszystkich `/api/office/*` endpointów
- [ ] **P0 #2:** Dodać security headers w `next.config.mjs`
- [ ] **P0 #3:** Dodać walidację Zod do API endpoints
- [ ] **P1 #4:** Dodać rate limiting
- [ ] **P1 #5:** Dodać security logging do Stripe webhook
- [ ] **P1 #6:** Wymuszenie HTTPS w middleware

### Rekomendowane:
- [ ] **P2 #8:** Zweryfikować RLS policies w Supabase
- [ ] **P2 #9:** Skonfigurować monitoring (Sentry)
- [ ] **P2 #10:** Ustalić harmonogram rotacji kluczy

### Konfiguracja produkcyjna:
- [ ] Ustawić wszystkie env vars w Vercel
- [ ] `STRIPE_WEBHOOK_SECRET` - utworzyć webhook w Stripe dla produkcji
- [ ] Skonfigurować custom domain z SSL
- [ ] Skonfigurować backup bazy Supabase
- [ ] Przetestować scenariusz disaster recovery

---

## 🛠️ Kolejne kroki

1. **NAJPIERW:** Napraw P0 #1 (autoryzacja API) - to jest najbardziej krytyczne
2. Dodaj security headers (P0 #2)
3. Dodaj walidację (P0 #3)
4. Dodaj rate limiting (P1 #4)
5. Przetestuj wszystko lokalnie
6. Deploy na staging
7. Penetration testing (opcjonalnie: OWASP ZAP, Burp Suite)
8. Deploy na produkcję

---

**Autor:** Cascade AI Security Audit  
**Kontakt w razie pytań:** Ten dokument jest punktem wyjścia. Każdy P0 musi być naprawiony.

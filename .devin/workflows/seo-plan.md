---
description: Plan SEO – pozycjonowanie starkit.pl na "wynajem starlink", "wynajem starlink mini", "wynajem starlink standard" (Google Search + LLM)
---

# Plan SEO – Starkit.pl → TOP 1-3 na "Wynajem Starlink"

**Data:** 27.05.2026  
**Cel:** Wyprzedzenie konkurencji (plenti.app, wynajem-internetu.pl, kosmicznywynajem.pl, novalinks.pl, starlinkrent.pl, wynajmijstarlink.pl) na frazy:
- "wynajem starlink" (główna)
- "wynajem starlink mini"
- "wynajem starlink standard"
- "wypożyczalnia starlink"

**Stan aktualny:** Strona startkit.pl jest na końcu pierwszej strony (~pozycja 7-10). Strona istnieje ok. 6 miesięcy.

---

## Analiza konkurencji

| Konkurent | Pozycja (est.) | Silne strony | Słabe strony |
|---|---|---|---|
| plenti.app | TOP 3 | Duża domena (marketplace), dużo linków | Brak dedykowanej treści, generyczny opis |
| wynajem-internetu.pl | TOP 3 | EMD (exact match domain), proste UI | Mało treści, brak bloga, brak schema |
| kosmicznywynajem.pl | TOP 5 | Dedykowana strona produktu, cennik | Mało treści, dziwny design |
| novalinks.pl | TOP 5 | FAQ, ładne UI | Bardzo mało treści, brak bloga |
| starlinkrent.pl | ~7-8 | Dedykowana domena | Prawie zero treści, brak bloga |
| wynajmijstarlink.pl | ~5-7 | EMD, form rezerwacji | Mało treści, 1 strona |

**Wniosek:** Większość konkurencji ma BARDZO MAŁO treści. Starkit.pl ma **największy potencjał** dzięki blogowi (~30 artykułów), strukturze city pages, FAQ, i structured data. Problem to brak wystarczającej optymalizacji on-page na kluczowych stronach produktowych.

---

## FAZA 1: On-Page SEO (krytyczne poprawki techniczne) – IMPLEMENTACJA W KODZIE

### 1.1 Poprawa meta tagów na stronach produktowych
**Pliki:** `app/products/[slug]/page.tsx`

**Problem:** Fallback title to `Wynajem {product.title} – cena, dostawa | Starkit` – brak frazy "wynajem starlink mini/standard" w pełnej formie.

**Rozwiązanie:**
- Starlink Mini: `"Wynajem Starlink Mini – cena od 39 zł/dzień, dostawa 24h | Starkit.pl"`
- Starlink Standard: `"Wynajem Starlink Standard – cena od 59 zł/dzień, dostawa 24h | Starkit.pl"`
- Description Mini: `"Wynajmij Starlink Mini – kompaktowy internet satelitarny do 350 Mbps. Idealny na kampera, podróże i pracę zdalną. Dostawa w 24h w całej Polsce. Zamów online."`
- Description Standard: `"Wynajmij Starlink Standard – szybki internet satelitarny do 350 Mbps dla 128 urządzeń. Na event, wesele, budowę. Dostawa 24h. Zamów online na Starkit.pl."`

### 1.2 Rozszerzenie keywords w root layout
**Plik:** `app/layout.tsx`

**Dodać:**
- "starlink do wynajęcia"
- "wypożyczalnia starlink mini"
- "wypożyczalnia starlink standard"
- "internet satelitarny wynajem"
- "starlink polska wynajem"
- "wynajem starlink cena"
- "starlink na event"

### 1.3 Dodanie Service + RentalService structured data
**Nowy plik:** `components/seo/service-schema.tsx`

Dodać schema.org/Service z:
- `serviceType: "Rental"` 
- `provider: Organization (Starkit)`
- `areaServed: Poland`
- `hasOfferCatalog` z Mini i Standard
- `aggregateRating`

### 1.4 Dodanie Speakable schema (dla voice search + LLM)
Na stronach produktowych dodać `speakable` property w schema.

### 1.5 Poprawa heading hierarchy na stronach produktowych
H1: "Wynajem Starlink Mini" / "Wynajem Starlink Standard" ✅ (już OK)
Dodać widoczne H2: "Cennik wynajmu Starlink Mini" (zamiast ukrytego div)
Dodać H2: "Jak wynająć Starlink Mini?"
Dodać H2: "Specyfikacja techniczna Starlink Mini"

### 1.6 Usunięcie hidden pricing div (clip rect)
**Problem:** `PricingPreview` jest ukryty za pomocą `clip: rect(0,0,0,0)` – Google może to traktować jako hidden text spam.
**Rozwiązanie:** Pokazać pricing jako widoczną sekcję na stronie.

---

## FAZA 2: Rozbudowa treści na stronach produktowych

### 2.1 Dodanie sekcji "Jak wynająć Starlink Mini/Standard?"
Widoczna sekcja z krokami (już jest na stronie głównej, ale brakuje na product page).

### 2.2 Dodanie sekcji "Dla kogo jest wynajem Starlink Mini?"
Use cases z ikonami – kampery, praca zdalna, eventy, budowy, działki.

### 2.3 Dodanie porównawczej tabeli "Starlink Mini vs Standard"
Na każdej stronie produktowej – widoczna tabela porównawcza.

### 2.4 Dodanie sekcji "Opinie klientów" bezpośrednio na product page
Nie tylko schema, ale widoczne opinie z gwiazdkami.

---

## FAZA 3: Optymalizacja techniczna

### 3.1 Dodanie llms.txt (dla LLM/AI crawlerów)
**Nowy plik:** `public/llms.txt`
Plik opisujący usługi w formacie zoptymalizowanym pod LLM.

### 3.2 Dodanie llms-full.txt
Rozszerzony plik z pełnymi informacjami.

### 3.3 Poprawa sitemap priorities
- Products: priority 0.9 (z 0.8)
- Homepage: priority 1.0
- Blog posts: priority 0.7

### 3.4 Dodanie redirectu www → non-www (lub odwrotnie)
Sprawdzić konsystencję. Aktualnie canonical wskazuje `starkit.pl` ale domena to `www.starkit.pl`.

### 3.5 Usunięcie Google Ads script (zbanowany)
Usunąć zbędny script Google Ads z `app/layout.tsx` – nie ma sensu ładować JS który nic nie robi, a spowalnia stronę.

---

## FAZA 4: Optymalizacja dla LLM (ChatGPT, Perplexity, Gemini)

### 4.1 Dodanie structured data `@type: "HowTo"` 
Na stronach produktowych – "Jak wynająć Starlink" krok po kroku.

### 4.2 Dodanie FAQPage schema z odpowiedziami semantycznymi
Rozbudowane FAQ z odpowiedziami, które LLM mogą cytować:
- "Ile kosztuje wynajem Starlink?"
- "Jak wynająć Starlink?"
- "Gdzie mogę wynająć Starlink w Polsce?"
- "Czy wynajem Starlink jest dostępny w mojej okolicy?"

### 4.3 Dodanie sekcji "Porównanie dostawców"
Na blogu lub stronie informacyjnej – obiektywne porównanie z konkurencją.

### 4.4 Optymalizacja meta descriptions pod featured snippets
Używać format: pytanie → krótka odpowiedź.

---

## FAZA 5: Interlinking

### 5.1 Dodanie breadcrumbs na każdej stronie
✅ Już jest na product pages.

### 5.2 Wzmocnienie cross-linking między product pages
✅ Już jest sekcja "Sprawdź również" – OK.

### 5.3 Dodanie linków z bloga do product pages
Blog → Product linking z anchor text "wynajem starlink mini", "wynajem starlink standard".

### 5.4 Dodanie linków z product pages do kluczowych blog posts
✅ Częściowo jest (footer links) – rozbudować.

---

## Priorytety implementacji w kodzie

1. **KRYTYCZNE** – Meta tagi, Service schema, ukryty pricing → widoczny
2. **WAŻNE** – llms.txt, rozbudowa treści na product pages, HowTo schema
3. **ŚREDNIE** – Usunięcie Google Ads, sitemap priorities
4. **BONUS** – Porównanie dostawców (content w Sanity)

---

## Co NIE jest w kodzie (wymagane w Sanity CMS)

- Ustawienie meta_title i meta_description na produktach (jeśli nie ustawione, fallback jest OK)
- Dodanie więcej blog postów targetujących long-tail keywords
- Rozbudowa city pages o więcej treści
- Dodanie nowych testimoniali

---

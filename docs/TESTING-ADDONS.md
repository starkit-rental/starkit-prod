# 🧪 Instrukcje testowania dodatków produktowych

## ✅ Co zostało zaimplementowane

### Backend:
- ✅ Kolumna `product_id` w `order_items` (Supabase)
- ✅ 4 produkty addon w Sanity Studio
- ✅ 4 produkty addon w Supabase products + stock_items
- ✅ Pricing tiers dla Powerbanku
- ✅ Linki dodatków do Starlink Mini

### Frontend:
- ✅ Karuzela dodatków w RentalWidget
- ✅ Sprawdzanie dostępności dodatków
- ✅ Overlay "Niedostępny" gdy zajęty
- ✅ Przycisk Dodaj/Usuń
- ✅ Link "Zobacz więcej" do strony produktu

### API:
- ✅ Sprawdzanie dostępności dodatków
- ✅ Przypisywanie stock_item_id dla dodatków
- ✅ Tworzenie order_items dla dodatków
- ✅ Dodawanie dodatków do Stripe line items
- ✅ Obliczanie cen z pricing tiers

### Automatyczne (już działało):
- ✅ PDF umowy zawiera dodatki
- ✅ Email potwierdzenia zawiera dodatki
- ✅ Panel zamówienia pokazuje dodatki
- ✅ Dashboard timeline pokazuje dodatki

---

## 🧪 Plan testów

### Test 1: Wyświetlanie dodatków

1. Otwórz: `https://starkit.pl/products/starlink-mini`
2. Wybierz daty (np. jutro + 7 dni)
3. **Sprawdź:**
   - ✅ Pojawia się sekcja "🎁 Polecane akcesoria"
   - ✅ Widoczna karuzela z 4 dodatkami:
     - Powerbank Cayon 60000mAh PD100W (20 zł/dzień)
     - Przewód USC-C Starlink mini (GRATIS)
     - Uchwyt na szybę Starlink Mini (GRATIS)
     - Zasilacz samochodowy Starlink Mini (GRATIS)
   - ✅ Każdy dodatek ma zdjęcie, nazwę, cenę, przycisk "Dodaj"
   - ✅ Karuzela przewija się strzałkami (desktop)

### Test 2: Dodawanie dodatków

1. Na stronie Starlink Mini wybierz daty
2. Kliknij **"Dodaj"** na Powerbanku
3. **Sprawdź:**
   - ✅ Przycisk zmienia się na "✓ Dodano"
   - ✅ Karta powerbanku ma zielony border
   - ✅ W podsumowaniu pojawia się: "+ Powerbank Cayon — 8 dni: 160 zł"
   - ✅ Cena razem wzrasta o 160 zł
4. Kliknij **"Dodaj"** na Przewodzie USC-C
5. **Sprawdź:**
   - ✅ Przewód dodany (zielony border)
   - ✅ W podsumowaniu: "+ Przewód USC-C: 0 zł"
   - ✅ Cena razem bez zmian (gratis)

### Test 3: Usuwanie dodatków

1. Kliknij **"✓ Dodano"** na Powerbanku
2. **Sprawdź:**
   - ✅ Przycisk wraca do "Dodaj"
   - ✅ Border wraca do szarego
   - ✅ Powerbank znika z podsumowania
   - ✅ Cena razem spada o 160 zł

### Test 4: Sprawdzanie dostępności dodatków

1. Wybierz daty, w których **wszystkie** powerbanki są zajęte (np. jeśli masz tylko 5 sztuk, zarezerwuj 5 zamówień)
2. Wróć na stronę Starlink Mini i wybierz te same daty
3. **Sprawdź:**
   - ✅ Powerbank ma overlay "🔒 Niedostępny"
   - ✅ Przycisk "Dodaj" jest ukryty
   - ✅ Tylko "Zobacz więcej →" jest widoczny
   - ✅ Pozostałe dodatki (przewód, uchwyt, zasilacz) są dostępne

### Test 5: Link do strony produktu

1. Kliknij **"Zobacz więcej →"** na Powerbanku
2. **Sprawdź:**
   - ✅ Przechodzi do `/products/powerbank-cayon-60000mah-pd100w`
   - ✅ Strona pokazuje pełny opis, zdjęcia, specyfikację
   - ✅ **BRAK widgetu wynajmu** (nie można zamówić samodzielnie)
   - ✅ Widoczna informacja: "Dostępny jako dodatek do Starlink"
   - ✅ Linki do Starlink Mini / Standard

### Test 6: Checkout z dodatkami

1. Na stronie Starlink Mini wybierz daty
2. Dodaj Powerbank i Przewód USC-C
3. Kliknij **"Zarezerwuj termin"**
4. **Sprawdź na stronie checkout:**
   - ✅ Podsumowanie zawiera:
     - Starlink Mini — 8 dni: 640 zł
     - Powerbank Cayon — 8 dni: 160 zł
     - Przewód USC-C: 0 zł
     - Kaucja: 500 zł
     - **RAZEM: 1300 zł**
5. Wypełnij formularz i przejdź do Stripe
6. **Sprawdź w Stripe Checkout:**
   - ✅ Line items:
     - Starlink Mini — wynajem (8 dni): 640 zł
     - Starlink Mini — kaucja: 500 zł
     - Powerbank Cayon 60000mAh PD100W (dodatek): 160 zł
   - ✅ Total: 1300 zł

### Test 7: Płatność testowa

1. W Stripe użyj karty testowej: `4242 4242 4242 4242`
2. Data: dowolna przyszła, CVC: dowolne 3 cyfry
3. Kliknij **"Pay"**
4. **Sprawdź:**
   - ✅ Przekierowanie na `/checkout/success`
   - ✅ Potwierdzenie zamówienia
   - ✅ Email potwierdzenia zawiera dodatki

### Test 8: Panel zamówienia (Office)

1. Zaloguj się do `/office`
2. Otwórz zamówienie z dodatkami
3. **Sprawdź:**
   - ✅ Lista produktów zawiera:
     - Starlink Mini (SN: XXX)
     - Powerbank Cayon 60000mAh PD100W (SN: POWERBANK_X)
     - Przewód USC-C Starlink mini (SN: CABLE_USBC_X)
   - ✅ Ceny są poprawne
   - ✅ Suma się zgadza

### Test 9: PDF umowy

1. W panelu zamówienia kliknij **"Generuj umowę"**
2. **Sprawdź w PDF:**
   - ✅ §2 Przedmiot najmu zawiera:
     - Starlink Mini — starlink_mini_1 (SN: XXX)
     - Powerbank Cayon 60000mAh PD100W (SN: POWERBANK_X)
     - Przewód USC-C Starlink mini (SN: CABLE_USBC_X)
   - ✅ Ceny w tabeli:
     - Starlink: 640 zł
     - Powerbank: 160 zł
     - Przewód: 0 zł
   - ✅ Suma: 800 zł + 500 zł kaucja = 1300 zł

### Test 10: Dashboard timeline

1. Otwórz `/office/dashboard`
2. **Sprawdź:**
   - ✅ Timeline pokazuje zajętość:
     - Starlink Mini (stock_item: starlink_mini_1)
     - Powerbank (stock_item: POWERBANK_X)
     - Przewód (stock_item: CABLE_USBC_X)
   - ✅ Wszystkie 3 produkty są zablokowane dla wybranych dat
   - ✅ Kolory wskazują rezerwację

### Test 11: Pricing tiers dla Powerbanku

1. Wybierz daty: **3 dni** (np. jutro + 3 dni)
2. Dodaj Powerbank
3. **Sprawdź:**
   - ✅ Cena powerbanku: **50 zł** (3 dni × 20 zł × 2.5 multiplier = 50 zł)
   - ✅ Nie 60 zł (3 × 20)
4. Zmień daty na **7 dni**
5. **Sprawdź:**
   - ✅ Cena powerbanku: **120 zł** (7 dni × 20 zł × 6.0 multiplier = 120 zł)
   - ✅ Nie 140 zł (7 × 20)

---

## 🐛 Znane ograniczenia

1. **Dodatki tylko dla Starlink Mini**
   - Starlink Standard nie ma podłączonych dodatków (możesz dodać ręcznie w Sanity Studio)

2. **Brak filtrowania dodatków**
   - Wszystkie dodatki pokazują się dla każdego produktu (jeśli są podłączone)
   - W przyszłości: filtrowanie po kategorii/tagach

3. **Brak walidacji ilości**
   - Można dodać ten sam dodatek tylko raz
   - W przyszłości: możliwość dodania np. 2 powerbanki

---

## 🔧 Troubleshooting

### Problem: Dodatki się nie pokazują

**Rozwiązanie:**
1. Sprawdź czy wybrano daty (karuzela pojawia się dopiero po wyborze dat)
2. Sprawdź w Sanity Studio czy Starlink Mini ma podłączone dodatki w polu "Available Addons"
3. Sprawdź console w przeglądarce (F12) - może być błąd API

### Problem: Dodatek pokazuje "Niedostępny" mimo że powinien być dostępny

**Rozwiązanie:**
1. Sprawdź w Supabase czy dodatek ma stock_items
2. Sprawdź w `/office/dashboard` czy stock_items dodatku nie są zajęte
3. Sprawdź czy `buffer_before` i `buffer_after` nie blokują dat

### Problem: Cena się nie zgadza

**Rozwiązanie:**
1. Sprawdź w Supabase `products` table czy `base_price_day` jest poprawna
2. Sprawdź w Supabase `pricing_tiers` table czy są tiers dla produktu
3. Sprawdź console - może być błąd w calculatePrice()

### Problem: Dodatki nie pojawiają się w PDF/email

**Rozwiązanie:**
1. Sprawdź w Supabase `order_items` table czy dodatki mają `product_id` i `stock_item_id`
2. Sprawdź w `/office/orders/[id]` czy dodatki są widoczne
3. Jeśli są w panelu ale nie w PDF - problem z generowaniem PDF

---

## 📊 Metryki sukcesu

Po testach powinieneś zobaczyć:

- ✅ Dodatki wyświetlają się na stronie produktu
- ✅ Dostępność dodatków jest sprawdzana
- ✅ Ceny dodatków są poprawnie obliczane (z pricing tiers)
- ✅ Dodatki są dodawane do Stripe checkout
- ✅ Dodatki są zapisywane w order_items
- ✅ Dodatki są widoczne w PDF umowy
- ✅ Dodatki są widoczne w panelu zamówienia
- ✅ Dodatki blokują dostępność w dashboard

---

## 🚀 Następne kroki (opcjonalne)

1. **Dodaj zdjęcia do dodatków** w Sanity Studio
2. **Podłącz dodatki do Starlink Standard** w Sanity Studio
3. **Dodaj więcej dodatków** (np. router, kable, etui)
4. **Dodaj kategorie dodatków** (zasilanie, montaż, akcesoria)
5. **Dodaj możliwość wyboru ilości** (np. 2 powerbanki)
6. **Dodaj filtrowanie dodatków** po kategorii/tagach
7. **Dodaj rekomendacje** ("Klienci często wybierają...")

---

## 📝 Notatki

- Dodatki są **fizycznymi produktami** ze stock_items
- Dodatki **blokują dostępność** (jeśli wszystkie zajęte → niedostępny)
- Dodatki **używają pricing tiers** (jak główne produkty)
- Dodatki **NIE mogą być zamawiane samodzielnie** (tylko jako dodatek)
- System **automatycznie** obsługuje dodatki w PDF, email, panelu

---

**Powodzenia w testach! 🎉**

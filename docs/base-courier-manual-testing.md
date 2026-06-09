# Base Courier - Instrukcja testowania manualnego

## Przygotowanie do testów

### 1. Uruchom migrację bazy danych

W Supabase SQL Editor:
```sql
-- Skopiuj i uruchom zawartość pliku:
-- supabase/migrations/20260609_add_courier_shipments.sql
```

### 2. Uruchom aplikację

```bash
npm run dev
```

### 3. Przygotuj zamówienie testowe

Zamówienie musi mieć:
- ✅ Wybrany paczkomat InPost (`inpost_point_id`)
- ✅ Klienta z danymi: imię, nazwisko, telefon, email

## Test 1: Konfiguracja danych nadawcy

**Cel:** Sprawdzenie czy można edytować dane nadawcy

### Kroki:
1. Przejdź do `/office/settings/courier`
2. Sprawdź czy pola są wypełnione domyślnymi wartościami:
   - Imię: Maciej
   - Nazwisko: Godek
   - Telefon: 795097658
   - Email: starkit.rental@gmail.com
   - Ulica: Cumownicza
   - Nr budynku: 1a
   - Nr mieszkania: 2
   - Kod pocztowy: 60-480
   - Miasto: Poznań
   - Paczkomat: POZ118M

3. Zmień dowolne pole (np. telefon na 123456789)
4. Kliknij "Zapisz zmiany"
5. Odśwież stronę
6. Sprawdź czy zmiana została zapisana

### Oczekiwany rezultat:
- ✅ Formularz się ładuje
- ✅ Dane są zapisywane
- ✅ Po odświeżeniu dane są zachowane
- ✅ Pojawia się komunikat sukcesu

---

## Test 2: Generowanie etykiety wysyłkowej (bez opcji)

**Cel:** Sprawdzenie podstawowego flow tworzenia przesyłki

### Kroki:
1. Otwórz zamówienie z wybranym paczkomat InPost
2. Przewiń do sekcji "Etykiety kurierskie InPost"
3. Wybierz rozmiar paczki: "Mała (18 × 35 × 60 cm, gabaryt B)"
4. Kliknij "Wygeneruj etykietę wysyłkową"
5. W modalu sprawdź dane:
   - **Nadawca:** Twoje dane (z ustawień)
   - **Odbiorca:** Dane klienta
   - **Paczkomat nadania:** POZ118M
   - **Paczkomat odbioru:** ID z zamówienia
6. NIE zaznaczaj żadnych opcji (ubezpieczenie, sobota)
7. Kliknij "Potwierdź i utwórz"

### Oczekiwany rezultat:
- ✅ Modal się otwiera
- ✅ Dane nadawcy i odbiorcy są poprawne
- ✅ Przesyłka zostaje utworzona
- ✅ Przycisk zmienia się na "Etykieta wysyłkowa utworzona"
- ✅ W bazie danych pojawia się rekord w `courier_shipments`:
  ```sql
  SELECT * FROM courier_shipments WHERE order_id = 'twoje-order-id';
  ```

---

## Test 3: Generowanie etykiety zwrotnej (z opcjami)

**Cel:** Sprawdzenie tworzenia przesyłki zwrotnej z ubezpieczeniem i dostawą w sobotę

### Kroki:
1. W tym samym zamówieniu kliknij "Wygeneruj etykietę zwrotną"
2. W modalu sprawdź dane:
   - **Nadawca:** Dane klienta (odwrócone!)
   - **Odbiorca:** Twoje dane
   - **Paczkomat nadania:** ID z zamówienia (klient)
   - **Paczkomat odbioru:** POZ118M (Ty)
3. Zaznacz "Ubezpieczenie przesyłki"
4. Ustaw wartość ubezpieczenia: 1000 zł
5. Zaznacz "Dostawa w sobotę"
6. Kliknij "Potwierdź i utwórz"

### Oczekiwany rezultat:
- ✅ Modal pokazuje odwrócone dane (klient → Ty)
- ✅ Opcje ubezpieczenia i soboty są widoczne
- ✅ Przesyłka zostaje utworzona
- ✅ Przycisk zmienia się na "Etykieta zwrotna utworzona"
- ✅ W bazie danych:
  ```sql
  SELECT * FROM courier_shipments 
  WHERE order_id = 'twoje-order-id' 
  AND shipment_type = 'return';
  ```

---

## Test 4: Pobieranie PDF z etykietami

**Cel:** Sprawdzenie łączenia etykiet w jeden PDF

### Kroki:
1. Po utworzeniu obu etykiet (wysyłkowa + zwrotna)
2. Kliknij "Pobierz etykiety PDF (A4)"
3. Poczekaj na pobranie pliku

### Oczekiwany rezultat:
- ✅ Plik PDF zostaje pobrany
- ✅ Nazwa pliku: `etykiety-SK-2026-XXX.pdf` (lub `etykiety-{orderId}.pdf`)
- ✅ PDF zawiera 2 strony (lub więcej jeśli etykiety są wielostronicowe)
- ✅ Pierwsza strona: etykieta wysyłkowa
- ✅ Druga strona: etykieta zwrotna
- ✅ Etykiety są czytelne i gotowe do wydruku

---

## Test 5: Walidacja - brak paczkomatu

**Cel:** Sprawdzenie obsługi błędów

### Kroki:
1. Otwórz zamówienie BEZ wybranego paczkomatu InPost
2. Przewiń do sekcji "Etykiety kurierskie InPost"

### Oczekiwany rezultat:
- ✅ Widoczny komunikat: "Brak wybranego paczkomatu InPost w zamówieniu"
- ✅ Przyciski są ukryte lub nieaktywne

---

## Test 6: Zmiana rozmiaru paczki

**Cel:** Sprawdzenie czy rozmiar paczki wpływa na przesyłkę

### Kroki:
1. Otwórz nowe zamówienie z paczkomat
2. Wybierz rozmiar: "Duża (64 × 38 × 41 cm, 15kg, gabaryt C)"
3. Wygeneruj etykietę wysyłkową
4. W modalu sprawdź czy rozmiar jest poprawny

### Oczekiwany rezultat:
- ✅ Modal pokazuje: "Rozmiar paczki: Duża (64 × 38 × 41 cm, 15kg, gabaryt C)"
- ✅ Przesyłka zostaje utworzona z poprawnymi wymiarami
- ✅ W bazie: `parcel_size = 'large'`

---

## Test 7: Wielokrotne generowanie

**Cel:** Sprawdzenie czy można wygenerować etykiety ponownie

### Kroki:
1. Wygeneruj etykietę wysyłkową
2. Spróbuj kliknąć ponownie "Wygeneruj etykietę wysyłkową"

### Oczekiwany rezultat:
- ✅ Przycisk jest nieaktywny (disabled)
- ✅ Tekst przycisku: "Etykieta wysyłkowa utworzona"
- ✅ Nie można utworzyć duplikatu

---

## Test 8: Sprawdzenie danych w Base Courier API

**Cel:** Weryfikacja czy przesyłka faktycznie trafiła do Base Courier

### Kroki:
1. Zaloguj się do [panelu Base Courier](https://send.blpaczka.com)
2. Przejdź do listy przesyłek
3. Znajdź przesyłkę po numerze referencyjnym (SK-2026-XXX)

### Oczekiwany rezultat:
- ✅ Przesyłka widoczna w panelu Base Courier
- ✅ Status: PROCESSING lub READY_TO_SEND
- ✅ Dane nadawcy i odbiorcy są poprawne
- ✅ Wymiary paczki są poprawne
- ✅ Jeśli zaznaczono ubezpieczenie - wartość jest widoczna
- ✅ Jeśli zaznaczono sobotę - usługa jest dodana

---

## Test 9: Pobieranie etykiety tylko wysyłkowej

**Cel:** Sprawdzenie czy PDF działa z jedną etykietą

### Kroki:
1. Wygeneruj TYLKO etykietę wysyłkową (bez zwrotnej)
2. Kliknij "Pobierz etykiety PDF (A4)"

### Oczekiwany rezultat:
- ✅ PDF zostaje pobrany
- ✅ Zawiera tylko 1 etykietę (wysyłkową)

---

## Test 10: Różne dane klienta

**Cel:** Sprawdzenie parsowania różnych formatów imion

### Testy do wykonania:

| Imię klienta | Oczekiwany firstName | Oczekiwany lastName |
|--------------|---------------------|---------------------|
| Jan Kowalski | Jan | Kowalski |
| Jan | Jan | Starkit |
| Jan Maria Kowalski | Jan | Maria Kowalski |
| (puste) | Klient | Starkit |

### Kroki:
1. Utwórz zamówienia z różnymi formatami imion
2. Generuj etykiety
3. Sprawdź w modalu czy dane są poprawnie parsowane

### Oczekiwany rezultat:
- ✅ Wszystkie formaty są obsługiwane
- ✅ Brak błędów przy pustych danych

---

## Checklist końcowy

Po wykonaniu wszystkich testów sprawdź:

- [ ] Migracja bazy danych wykonana
- [ ] pdf-lib zainstalowany
- [ ] Testy jednostkowe przechodzą (`npm test`)
- [ ] Dane nadawcy można edytować
- [ ] Etykieta wysyłkowa działa
- [ ] Etykieta zwrotna działa
- [ ] Ubezpieczenie działa
- [ ] Dostawa w sobotę działa
- [ ] PDF z etykietami pobiera się poprawnie
- [ ] Walidacja błędów działa
- [ ] Przesyłki widoczne w panelu Base Courier
- [ ] Różne rozmiary paczek działają
- [ ] Parsowanie imion działa poprawnie

---

## Znane problemy i ograniczenia

1. **Sandbox vs Production:**
   - W development używany jest sandbox API
   - W production używane jest prawdziwe API
   - Przesyłki z sandbox nie są prawdziwe

2. **Limit przesyłek:**
   - Sprawdź limity w panelu Base Courier
   - Sandbox może mieć ograniczenia

3. **Czas generowania etykiety:**
   - Może potrwać kilka sekund
   - Nie odświeżaj strony podczas tworzenia

4. **Duplikaty:**
   - System nie pozwala na wielokrotne generowanie tej samej etykiety
   - Aby wygenerować ponownie, usuń rekord z `courier_shipments`

---

## Raportowanie błędów

Jeśli znajdziesz błąd, zgłoś go z następującymi informacjami:

1. Krok, na którym wystąpił błąd
2. Komunikat błędu (jeśli jest)
3. Zrzut ekranu
4. Logi z konsoli przeglądarki (F12)
5. Dane zamówienia (ID, numer)
6. Środowisko (development/production)

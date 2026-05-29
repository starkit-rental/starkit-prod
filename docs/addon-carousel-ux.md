# Dodatki w formie karuzeli - Zaktualizowany UX

## 🎨 Nowy design - Karuzela produktów

### Strona produktu - Widget wynajmu

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Zarezerwuj termin                                        │
│ Wybierz daty i sprawdź cenę wynajmu                         │
├─────────────────────────────────────────────────────────────┤
│ OKRES WYNAJMU (minimum 3 dni)                              │
│ [📅 5 cze → 12 cze 2026]                                   │
├─────────────────────────────────────────────────────────────┤
│ PODSUMOWANIE                                                │
│ Starlink Mini — 8 dni                          640.00 zł   │
│ Kaucja zwrotna                                500.00 zł   │
│ ─────────────────────────────────────────────────────────── │
│ Razem                                        1140.00 zł   │
├─────────────────────────────────────────────────────────────┤
│ ✅ Termin dostępny                                          │
│ [Zarezerwuj termin →]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎁 Polecane akcesoria                                       │
│                                                             │
│ ← [Karuzela] →                                              │
│                                                             │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│ │ [IMG]    │  │ [IMG]    │  │ [IMG]    │  │ [IMG]    │    │
│ │          │  │          │  │          │  │          │    │
│ │Powerbank │  │Przewód   │  │Uchwyt    │  │Zasilacz  │    │
│ │Cayon     │  │USC-C     │  │na szybę  │  │12V/24V   │    │
│ │          │  │          │  │          │  │          │    │
│ │20 zł/dz  │  │GRATIS    │  │GRATIS    │  │GRATIS    │    │
│ │          │  │          │  │          │  │          │    │
│ │[Dodaj]   │  │[Dodaj]   │  │[Dodaj]   │  │[Dodaj]   │    │
│ │[Zobacz→] │  │[Zobacz→] │  │[Zobacz→] │  │[Zobacz→] │    │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
│ • • ○ ○  (pagination dots)                                  │
└─────────────────────────────────────────────────────────────┘
```

### Gdy użytkownik doda Powerbank:

```
┌─────────────────────────────────────────────────────────────┐
│ 🎁 Polecane akcesoria                                       │
│                                                             │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │ [IMG]    │  │ [IMG]    │  │ [IMG]    │                  │
│ │          │  │          │  │          │                  │
│ │Powerbank │  │Przewód   │  │Uchwyt    │                  │
│ │Cayon     │  │USC-C     │  │na szybę  │                  │
│ │          │  │          │  │          │                  │
│ │20 zł/dz  │  │GRATIS    │  │GRATIS    │                  │
│ │✓ Dodano  │  │[Dodaj]   │  │[Dodaj]   │  ← "Dodano" gdy zaznaczone
│ │[Usuń]    │  │[Zobacz→] │  │[Zobacz→] │  ← "Usuń" zamiast "Dodaj"
│ └──────────┘  └──────────┘  └──────────┘                  │
│    ↑ Zielony border gdy dodane                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PODSUMOWANIE                                                │
│ Starlink Mini — 8 dni                          640.00 zł   │
│ + Powerbank Cayon — 8 dni                      160.00 zł   │ ← Nowa linia
│ Kaucja zwrotna                                500.00 zł   │
│ ─────────────────────────────────────────────────────────── │
│ Razem                                        1300.00 zł   │
└─────────────────────────────────────────────────────────────┘
```

### Gdy dodatek niedostępny w wybranym terminie:

```
┌──────────┐
│ [IMG]    │
│ 🔒       │  ← Overlay z ikoną
│          │
│Powerbank │
│Cayon     │
│          │
│Niedostępny│ ← Czerwony tekst
│5-12 cze  │
│          │
│[Zobacz→] │ ← Tylko "Zobacz", bez "Dodaj"
└──────────┘
```

---

## 🎯 Kluczowe zasady UX

### 1. **Dodatki NIE mogą być zamawiane samodzielnie**
- ❌ Brak możliwości przejścia do `/checkout` z samym dodatkiem
- ✅ Dodatki można dodać TYLKO na stronie głównego produktu
- ✅ Link "Zobacz więcej →" prowadzi do `/products/powerbank-cayon` (karta produktu)
- ✅ Na karcie dodatku: brak widgetu wynajmu, tylko opis + "Dostępny jako dodatek do Starlink"

### 2. **Sprawdzanie dostępności dodatków**
- ⚠️ Dodatki mogą mieć ograniczoną ilość (np. 5 powerbanków)
- ✅ Sprawdzamy dostępność dla wybranego terminu
- ✅ Jeśli niedostępny → overlay "Niedostępny w tym terminie"
- ✅ Przycisk "Dodaj" jest disabled

### 3. **Karuzela responsywna**
- Desktop: 4 produkty widoczne
- Tablet: 3 produkty
- Mobile: 1-2 produkty
- Strzałki nawigacji + pagination dots
- Swipe na mobile

---

## 🔧 Implementacja techniczna

### Komponent karuzeli

```tsx
// app/products/_components/addon-carousel.tsx

type AddonProduct = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  pricePerDay: number;
  images?: any[];
  isAvailable: boolean;  // ← Sprawdzone dla wybranego terminu
  unavailableReason?: string;
};

type AddonCarouselProps = {
  addons: AddonProduct[];
  selectedAddonIds: Set<string>;
  onToggleAddon: (addonId: string) => void;
  startDate?: string;
  endDate?: string;
};

export function AddonCarousel({
  addons,
  selectedAddonIds,
  onToggleAddon,
  startDate,
  endDate
}: AddonCarouselProps) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">🎁 Polecane akcesoria</h3>
      
      <Carousel>
        <CarouselContent>
          {addons.map(addon => (
            <CarouselItem key={addon._id} className="md:basis-1/3 lg:basis-1/4">
              <AddonCard
                addon={addon}
                isSelected={selectedAddonIds.has(addon._id)}
                onToggle={() => onToggleAddon(addon._id)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
```

### Karta dodatku

```tsx
function AddonCard({ addon, isSelected, onToggle }: AddonCardProps) {
  const isAdded = isSelected;
  const isAvailable = addon.isAvailable;
  
  return (
    <div className={cn(
      "relative rounded-lg border-2 p-4 transition-all",
      isAdded ? "border-green-500 bg-green-50" : "border-slate-200",
      !isAvailable && "opacity-60"
    )}>
      {/* Image */}
      <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-slate-100">
        {addon.images?.[0] && (
          <Image
            src={addon.images[0]}
            alt={addon.title}
            fill
            className="object-cover"
          />
        )}
        
        {/* Overlay gdy niedostępny */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Lock className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Niedostępny</p>
              <p className="text-xs">{addon.unavailableReason}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Title */}
      <h4 className="font-semibold text-sm mb-1 line-clamp-2">
        {addon.title}
      </h4>
      
      {/* Price */}
      <p className="text-lg font-bold text-slate-900 mb-3">
        {addon.pricePerDay > 0 ? `${addon.pricePerDay} zł/dzień` : 'GRATIS'}
      </p>
      
      {/* Actions */}
      <div className="space-y-2">
        {/* Przycisk Dodaj/Usuń */}
        {isAvailable && (
          <Button
            onClick={onToggle}
            variant={isAdded ? "outline" : "default"}
            size="sm"
            className="w-full"
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Dodano
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Dodaj
              </>
            )}
          </Button>
        )}
        
        {/* Link do karty produktu */}
        <Link
          href={`/products/${addon.slug.current}`}
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          Zobacz więcej →
        </Link>
      </div>
    </div>
  );
}
```

### Sprawdzanie dostępności dodatków

```tsx
// W rental-widget.tsx

const [addonAvailability, setAddonAvailability] = useState<
  Record<string, boolean>
>({});

// Sprawdź dostępność dodatków gdy zmienią się daty
useEffect(() => {
  if (!startDate || !endDate || !availableAddons) return;
  
  async function checkAddonsAvailability() {
    const results: Record<string, boolean> = {};
    
    for (const addon of availableAddons) {
      // Sprawdź czy dodatek ma stock_items
      const { data: stockItems } = await supabase
        .from('stock_items')
        .select('id')
        .eq('product_id', addon._id);
      
      if (!stockItems || stockItems.length === 0) {
        // Brak stock_items = nieograniczony (virtual product)
        results[addon._id] = true;
        continue;
      }
      
      // Sprawdź dostępność przez API
      const res = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: addon._id,
          startDate,
          endDate,
        }),
      });
      
      const json = await res.json();
      results[addon._id] = json.available === true;
    }
    
    setAddonAvailability(results);
  }
  
  checkAddonsAvailability();
}, [startDate, endDate, availableAddons]);
```

---

## 📄 Karta produktu dodatku (bez możliwości zamówienia)

### `/products/powerbank-cayon`

```
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumbs: Strona główna > Oferta > Powerbank Cayon]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Galeria zdjęć]          Powerbank Cayon 60000mAh PD100W   │
│                                                             │
│                          20 zł/dzień                        │
│                                                             │
│                          ℹ️ Dostępny jako dodatek           │
│                          do wynajmu Starlink                │
│                                                             │
│                          [Zobacz Starlink Mini →]           │
│                          [Zobacz Starlink Standard →]       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ OPIS                                                        │
│ Potężny powerbank o pojemności 60000mAh...                 │
│                                                             │
│ SPECYFIKACJA                                                │
│ • Pojemność: 60000mAh                                       │
│ • Moc: 100W PD                                              │
│ • Porty: 2x USB-C, 2x USB-A                                 │
│                                                             │
│ IDEALNE DO                                                  │
│ • Praca zdalna w terenie                                    │
│ • Eventy outdoor                                            │
│ • Budowy bez prądu                                          │
└─────────────────────────────────────────────────────────────┘
```

**Kluczowe elementy:**
- ❌ **BRAK widgetu wynajmu** (nie można zamówić samodzielnie)
- ✅ Informacja "Dostępny jako dodatek do wynajmu Starlink"
- ✅ Linki do produktów głównych (Starlink Mini, Standard)
- ✅ Pełny opis, zdjęcia, specyfikacja
- ✅ SEO-friendly (indexed, ale z noindex dla checkout)

---

## 🔄 Zaktualizowany flow użytkownika

### Scenariusz 1: Dodanie dodatku z karuzeli
1. Użytkownik wchodzi na `/products/starlink-mini`
2. Wybiera daty: 5-12 czerwca
3. Widzi karuzelę z 4 dodatkami
4. Powerbank jest dostępny → klikamy "Dodaj"
5. Karta powerbanku zmienia border na zielony, przycisk "Dodano"
6. W podsumowaniu pojawia się: "+ Powerbank — 8 dni: 160 zł"
7. Cena razem: 1300 zł
8. Klikamy "Zarezerwuj termin" → checkout z głównym + dodatkiem

### Scenariusz 2: Dodatek niedostępny
1. Użytkownik wybiera daty: 5-12 czerwca
2. Powerbank jest niedostępny (wszystkie wypożyczone)
3. Karta powerbanku ma overlay: 🔒 "Niedostępny 5-12 cze"
4. Przycisk "Dodaj" jest disabled
5. Użytkownik może kliknąć "Zobacz więcej" → karta produktu
6. Na karcie: opis + linki do Starlink (może wybrać inne daty)

### Scenariusz 3: Przeglądanie karty dodatku
1. Użytkownik klika "Zobacz więcej →" na powerbanku
2. Przechodzi do `/products/powerbank-cayon`
3. Widzi pełny opis, zdjęcia, specyfikację
4. Widzi info: "Dostępny jako dodatek do Starlink"
5. Klika "Zobacz Starlink Mini →"
6. Wraca do strony Starlink Mini, może dodać powerbank

---

## ✅ Zalety tego rozwiązania

1. **Wizualnie atrakcyjne** - karuzela ze zdjęciami
2. **Jasne** - widać od razu co jest dostępne, co nie
3. **Bezpieczne** - nie można zamówić samego dodatku
4. **SEO-friendly** - dodatki mają własne strony z opisami
5. **Responsywne** - działa na mobile i desktop
6. **Skalowalne** - łatwo dodać więcej dodatków
7. **Intuicyjne** - "Dodaj" zamiast checkboxa

---

## 🛠️ Zmiany w planie implementacji

### Task 6 (RentalWidget) - ZAKTUALIZOWANY

**Zamiast checkboxów:**
- Karuzela z kartami produktów
- Każda karta: zdjęcie, nazwa, cena, przyciski
- Sprawdzanie dostępności dodatków
- Overlay gdy niedostępny

**Nowe komponenty:**
- `AddonCarousel.tsx` - główna karuzela
- `AddonCard.tsx` - karta pojedynczego dodatku
- Użycie `shadcn/ui` Carousel component

### Task 3 (Sanity) - ZAKTUALIZOWANY

**Dodatkowo dla każdego dodatku:**
- Dodać pole `canBeOrderedAlone: false` (domyślnie false)
- Dodać pole `mainProducts` - referencje do głównych produktów
- Na stronie dodatku pokazać linki do głównych produktów

### Nowy Task 11 - Strony dodatków

**Cel:** Utworzyć strony produktów dla dodatków bez widgetu wynajmu

**Pliki:**
- Modify: `app/products/[slug]/page.tsx` - wykryć czy produkt to addon
- Create: `app/products/_components/addon-page-layout.tsx`

**Logika:**
```tsx
// W page.tsx
const isAddon = product.isAddon === true;

if (isAddon) {
  return <AddonPageLayout product={product} />;
}

return <StandardProductPage product={product} />;
```

---

## 📊 Podsumowanie zmian

| Element | Stara wersja | Nowa wersja |
|---------|-------------|-------------|
| UI dodatków | Checkboxy | Karuzela ze zdjęciami |
| Dostępność | Nie sprawdzana | Sprawdzana + overlay |
| Zamówienie samego dodatku | Możliwe (błąd) | Niemożliwe (by design) |
| Strona dodatku | Brak | Pełna strona z opisem |
| Responsywność | Podstawowa | Karuzela + swipe |
| Wizualizacja | Lista tekstowa | Karty ze zdjęciami |

---

## 🎯 Następne kroki

1. Zaktualizować plan implementacji
2. Dodać Task 11 - strony dodatków
3. Zmodyfikować Task 6 - karuzela zamiast checkboxów
4. Dodać sprawdzanie dostępności dodatków
5. Utworzyć komponenty AddonCarousel i AddonCard

"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CartButton() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    // Funkcja do aktualizacji licznika produktów
    const updateCartCount = () => {
      if (typeof window === 'undefined') return;

      // Metoda 1: Spróbuj pobrać z Booqable API
      if (window.Booqable?.cart?.itemCount) {
        try {
          const count = window.Booqable.cart.itemCount();
          if (typeof count === 'number') {
            setItemCount(count);
            return;
          }
        } catch (err) {
          // Cicho ignoruj błąd i spróbuj innych metod
        }
      }

      // Metoda 2: Sprawdź badge w launchers Booqable
      const badgeSelectors = [
        '#booqable-launcher-closed .bq-badge',
        '#booqable-launcher-open .bq-badge',
        '.booqable-launcher .bq-badge',
      ];

      for (const selector of badgeSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          const text = element.textContent.trim();
          const count = parseInt(text, 10);
          if (!isNaN(count) && count >= 0) {
            setItemCount(count);
            return;
          }
        }
      }

      // Metoda 3: Zsumuj ILOŚĆ SZTUK z każdej linii produktu
      const allCartLines = document.querySelectorAll('#booqable-sidebar .bq-list-item:not(.bq-list-header)');

      let totalQuantity = 0;
      Array.from(allCartLines).forEach(line => {
        const text = line.textContent?.toLowerCase() || '';
        // Pomiń kaucje zwrotne i inne opłaty
        const isDeposit = text.includes('kaucja') || text.includes('zwrotna') || text.includes('deposit');

        if (!isDeposit) {
          let quantity = 1;

          // Szukaj spana z ilością produktu (liczba wewnątrz przycisków +/-)
          const quantitySpans = line.querySelectorAll('.bq-quantity span, .bq-quantity-enabled span');

          for (const span of Array.from(quantitySpans)) {
            const spanText = span.textContent?.trim() || '';
            // Szukaj spana który zawiera TYLKO cyfrę
            if (/^\d+$/.test(spanText)) {
              const qtyNum = parseInt(spanText, 10);
              if (!isNaN(qtyNum) && qtyNum > 0) {
                quantity = qtyNum;
                break;
              }
            }
          }

          totalQuantity += quantity;
        }
      });

      if (totalQuantity > 0) {
        setItemCount(totalQuantity);
        return;
      }

      // Jeśli nic nie znaleziono, ustaw na 0
      setItemCount(0);
    };

    // Aktualizuj licznik natychmiast
    updateCartCount();

    // Nasłuchuj na zmiany w koszyku
    const events = [
      'booqable:cart:updated',
      'booqable:cart:changed',
      'booqable:cart:item-added',
      'booqable:cart:item-removed',
      'cart:updated',
      'DOMSubtreeModified' // Nasłuchuj na zmiany w DOM
    ];
    events.forEach(event => {
      window.addEventListener(event, updateCartCount);
    });

    // Dodaj MutationObserver dla lepszego śledzenia zmian w DOM
    const observer = new MutationObserver(updateCartCount);
    const booqableContainer = document.querySelector('#booqable-cart, [id*="booqable"]');
    if (booqableContainer) {
      observer.observe(booqableContainer, {
        childList: true,
        subtree: true
      });
    }

    // Aktualizuj co 5 sekund jako fallback
    const interval = setInterval(updateCartCount, 5000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateCartCount);
      });
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleClick = () => {
    if (typeof window === 'undefined') return;

    // Wyślij event aby załadować Booqable jeśli jeszcze nie jest załadowany
    window.dispatchEvent(new Event('cart:click'));

    // Metoda 1: Spróbuj użyć API Booqable do otwarcia koszyka
    const booqable = (window as any).Booqable;
    if (booqable) {
      // Spróbuj różnych metod API
      if (typeof booqable.openCart === 'function') {
        booqable.openCart();
        return;
      }
      if (booqable.cart && typeof booqable.cart.open === 'function') {
        booqable.cart.open();
        return;
      }
      if (typeof booqable.showCart === 'function') {
        booqable.showCart();
        return;
      }
    }

    // Metoda 2: Znajdź launcher i dispatchuj prawdziwe zdarzenie click
    const launcher = document.querySelector('#booqable-launcher-closed, #booqable-launcher-open, [id*="booqable-launcher"]') as HTMLElement;
    if (launcher) {
      // Tymczasowo pokaż element
      const originalOpacity = launcher.style.opacity;
      const originalPointerEvents = launcher.style.pointerEvents;
      const originalBottom = launcher.style.bottom;

      launcher.style.opacity = '1';
      launcher.style.pointerEvents = 'auto';
      launcher.style.bottom = '15px';

      // Stwórz prawdziwe zdarzenie click (nie .click())
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      launcher.dispatchEvent(clickEvent);

      // Przywróć style po małym opóźnieniu
      setTimeout(() => {
        launcher.style.opacity = originalOpacity;
        launcher.style.pointerEvents = originalPointerEvents;
        launcher.style.bottom = originalBottom;
      }, 300);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Button>
  );
}

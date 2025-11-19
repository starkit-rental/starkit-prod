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
          // Cicho ignoruj błąd
        }
      }

      // Metoda 2: Spróbuj znaleźć licznik w DOM
      const cartCountSelectors = [
        '.booqable-cart-count',
        '.cart-count',
        '[data-cart-count]',
        'button[aria-label*="cart" i] .count',
        'button[aria-label*="cart" i] .badge',
      ];

      for (const selector of cartCountSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          const count = parseInt(element.textContent.trim(), 10);
          if (!isNaN(count)) {
            setItemCount(count);
            return;
          }
        }
      }
    };

    // Aktualizuj licznik natychmiast
    updateCartCount();

    // Nasłuchuj na zmiany w koszyku
    const events = ['booqable:cart:updated', 'booqable:cart:changed', 'cart:updated'];
    events.forEach(event => {
      window.addEventListener(event, updateCartCount);
    });

    // Aktualizuj co 3 sekundy jako fallback
    const interval = setInterval(updateCartCount, 3000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateCartCount);
      });
      clearInterval(interval);
    };
  }, []);

  const handleClick = () => {
    if (typeof window === 'undefined') return;

    // Metoda 1: Spróbuj użyć Booqable trigger do otwarcia koszyka
    if (window.Booqable) {
      const booqable = window.Booqable as any;

      // Spróbuj trigger 'cart:open' lub podobne
      try {
        if (typeof booqable._trigger === 'function') {
          booqable._trigger('cart:open');
          console.log('[CartButton] Triggered cart:open event');
          return;
        }
      } catch (err) {
        console.log('[CartButton] Trigger method failed:', err);
      }

      // Spróbuj dispatchować custom event
      try {
        window.dispatchEvent(new CustomEvent('booqable:cart:open'));
        console.log('[CartButton] Dispatched booqable:cart:open event');
      } catch (err) {
        console.log('[CartButton] Custom event failed:', err);
      }
    }

    // Metoda 2: Znajdź i kliknij floating button Booqable
    // Ten button jest w iframe lub ma specyficzne atrybuty
    const selectors = [
      // Szukaj po data-slot (z poprzednich logów)
      'button[data-slot="button"]',
      // Szukaj po aria-label zawierającym "Shopping cart"
      'button[aria-label="Shopping cart"]',
      // Szukaj buttona z fixed position w prawym dolnym rogu
      'button.fixed',
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      // Pomiń nasz własny button w headerze
      const cartButton = Array.from(elements).find(
        btn => !btn.closest('header') && btn !== document.activeElement
      ) as HTMLElement;

      if (cartButton) {
        console.log('[CartButton] Found and clicking Booqable button:', cartButton);
        cartButton.click();
        return;
      }
    }

    console.warn('[CartButton] Could not find Booqable cart button');
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

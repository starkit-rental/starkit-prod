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
    console.log('[CartButton] Attempting to open Booqable cart...');

    if (typeof window === 'undefined' || !window.Booqable) {
      console.warn('[CartButton] Booqable not available');
      return;
    }

    // Debuguj dostępne metody w Booqable
    console.log('[CartButton] window.Booqable:', window.Booqable);
    console.log('[CartButton] Available Booqable methods:', Object.keys(window.Booqable));

    // Sprawdź wszystkie właściwości Booqable
    const booqable = window.Booqable as any;
    for (const key in booqable) {
      console.log(`[CartButton] Booqable.${key}:`, booqable[key]);
      if (typeof booqable[key] === 'object' && booqable[key]) {
        console.log(`[CartButton] Booqable.${key} methods:`, Object.keys(booqable[key]));
      }
    }

    // Spróbuj różne metody otwierania koszyka
    const methods = [
      () => booqable.cart?.open?.(),
      () => booqable.openCart?.(),
      () => booqable.showCart?.(),
      () => booqable.toggleCart?.(),
      () => booqable.cart?.show?.(),
      () => booqable.cart?.toggle?.(),
      () => booqable.widgets?.openCart?.(),
      () => booqable.widgets?.showCart?.(),
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        const result = methods[i]();
        if (result !== undefined) {
          console.log(`[CartButton] Method ${i} succeeded:`, result);
          return;
        }
      } catch (err) {
        // Cicho ignoruj
      }
    }

    console.warn('[CartButton] No working method found to open cart');
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

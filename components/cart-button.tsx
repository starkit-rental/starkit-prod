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
    // Spróbuj znaleźć i kliknąć istniejący widget koszyka Booqable
    const cartSelectors = [
      'button[aria-label*="cart" i]',
      'button[aria-label*="koszyk" i]',
      '.booqable-shopping-cart',
      '.booqable-cart',
      '[data-booqable-cart]',
      '.booqable-component[data-component="shopping-cart"]',
    ];

    for (const selector of cartSelectors) {
      const cartElement = document.querySelector(selector) as HTMLElement;
      if (cartElement) {
        cartElement.click();
        return;
      }
    }

    // Jeśli nie znaleziono przycisku, loguj ostrzeżenie
    console.warn('[CartButton] Could not find Booqable cart button to click');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative"
      aria-label="Shopping cart"
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

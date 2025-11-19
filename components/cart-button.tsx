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

    // Znajdź wszystkie buttony na stronie
    const allButtons = Array.from(document.querySelectorAll('button'));

    // Filtruj buttony które mają position: fixed lub absolute
    const positionedButtons = allButtons.filter(btn => {
      const style = window.getComputedStyle(btn);
      return style.position === 'fixed' || style.position === 'absolute';
    });

    console.log('[CartButton] Found positioned buttons:', positionedButtons);

    // Znajdź button w prawym dolnym rogu (Booqable cart) - poza headerem
    const bottomRightButton = positionedButtons.find(btn => {
      // Pomiń buttony w headerze
      if (btn.closest('header')) return false;

      const rect = btn.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Sprawdź czy button jest w prawym dolnym rogu
      // Prawy dolny róg: right > 70% szerokości i bottom > 70% wysokości
      const isBottomRight = rect.right > windowWidth * 0.7 && rect.bottom > windowHeight * 0.7;

      console.log(`[CartButton] Button check: right=${rect.right.toFixed(0)}, bottom=${rect.bottom.toFixed(0)}, window=${windowWidth}x${windowHeight}, bottomRight=${isBottomRight}`, btn);

      return isBottomRight;
    });

    if (bottomRightButton) {
      console.log('[CartButton] Found and clicking bottom-right button:', bottomRightButton);
      bottomRightButton.click();
      return;
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

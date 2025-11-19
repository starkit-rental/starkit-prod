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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('[CartButton] Searching for Booqable cart button...');

    // Znajdź wszystkie buttony na stronie
    const allButtons = Array.from(document.querySelectorAll('button'));
    console.log('[CartButton] All buttons on page:', allButtons);

    // Znajdź floating button (prawdopodobnie ma position fixed/absolute i jest w prawym dolnym rogu)
    const floatingButtons = allButtons.filter(btn => {
      const style = window.getComputedStyle(btn);
      return style.position === 'fixed' || style.position === 'absolute';
    });
    console.log('[CartButton] Fixed/absolute buttons:', floatingButtons);

    // Spróbuj znaleźć button z data-slot="button"
    const booqableButton = allButtons.find(btn =>
      btn.getAttribute('data-slot') === 'button' &&
      btn !== event.currentTarget
    );

    if (booqableButton) {
      console.log('[CartButton] Found Booqable button with data-slot:', booqableButton);
      booqableButton.click();
      return;
    }

    // Fallback: znajdź button w prawym dolnym rogu
    const bottomRightButton = floatingButtons.find(btn => {
      const rect = btn.getBoundingClientRect();
      return rect.right > window.innerWidth - 200 && rect.bottom > window.innerHeight - 200;
    });

    if (bottomRightButton) {
      console.log('[CartButton] Found bottom-right button:', bottomRightButton);
      bottomRightButton.click();
      return;
    }

    console.warn('[CartButton] Could not find Booqable cart button to click');
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

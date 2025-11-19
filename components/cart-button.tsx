"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CartButton() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    // Debug: sprawdź co jest dostępne w Booqable
    const logBooqableAPI = () => {
      if (typeof window !== 'undefined' && window.Booqable) {
        console.log('[CartButton] Booqable object:', window.Booqable);
        console.log('[CartButton] Available keys:', Object.keys(window.Booqable));

        // Sprawdź wszystkie możliwe lokalizacje koszyka
        const possiblePaths = [
          'cart',
          'Cart',
          'shopping_cart',
          'shoppingCart',
          'basket'
        ];

        possiblePaths.forEach(path => {
          if ((window.Booqable as any)[path]) {
            console.log(`[CartButton] Found ${path}:`, (window.Booqable as any)[path]);
            console.log(`[CartButton] ${path} methods:`, Object.keys((window.Booqable as any)[path]));
          }
        });
      }
    };

    // Loguj API po załadowaniu
    setTimeout(logBooqableAPI, 2000);

    // Sprawdź liczbę produktów w koszyku Booqable
    const updateCartCount = () => {
      if (typeof window !== 'undefined' && window.Booqable?.cart?.itemCount) {
        try {
          const count = window.Booqable.cart.itemCount();
          setItemCount(count || 0);
        } catch (err) {
          console.error('[CartButton] Failed to get cart count:', err);
        }
      }
    };

    // Aktualizuj licznik natychmiast
    updateCartCount();

    // Nasłuchuj na zmiany w koszyku
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('booqable:cart:updated', handleCartUpdate);

    // Aktualizuj co 2 sekundy jako fallback
    const interval = setInterval(updateCartCount, 2000);

    return () => {
      window.removeEventListener('booqable:cart:updated', handleCartUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleClick = () => {
    console.log('[CartButton] Cart button clicked');

    // Metoda 1: Spróbuj znaleźć i kliknąć istniejący widget koszyka
    const cartSelectors = [
      '.booqable-shopping-cart',
      '.booqable-cart',
      '[data-booqable-cart]',
      '.booqable-component[data-component="shopping-cart"]',
      'button[aria-label*="cart" i]',
      'button[aria-label*="koszyk" i]',
    ];

    let cartElement: HTMLElement | null = null;

    for (const selector of cartSelectors) {
      cartElement = document.querySelector(selector) as HTMLElement;
      if (cartElement) {
        console.log(`[CartButton] Found cart element with selector: ${selector}`);
        break;
      }
    }

    if (cartElement) {
      console.log('[CartButton] Clicking cart element:', cartElement);
      cartElement.click();
      return;
    }

    // Metoda 2: Spróbuj wszystkie metody w window.Booqable
    if (typeof window !== 'undefined' && window.Booqable) {
      console.log('[CartButton] Trying all Booqable methods...');

      const booqable = window.Booqable as any;
      const allKeys = Object.keys(booqable);
      console.log('[CartButton] All Booqable keys:', allKeys);

      // Spróbuj metody które mogą otwierać koszyk
      const possibleCartMethods = allKeys.filter((key: string) =>
        key.toLowerCase().includes('cart') ||
        key.toLowerCase().includes('open') ||
        key.toLowerCase().includes('show') ||
        key.toLowerCase().includes('toggle')
      );

      console.log('[CartButton] Possible cart methods:', possibleCartMethods);

      for (const method of possibleCartMethods) {
        if (typeof booqable[method] === 'function') {
          console.log(`[CartButton] Trying Booqable.${method}()`);
          try {
            booqable[method]();
            console.log(`[CartButton] Successfully called ${method}()`);
            return;
          } catch (err) {
            console.error(`[CartButton] Failed calling ${method}:`, err);
          }
        }
      }

      console.warn('[CartButton] No working cart method found');
    }
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

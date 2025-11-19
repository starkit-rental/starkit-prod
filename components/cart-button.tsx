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

    // Otwórz koszyk Booqable - próbuj różne metody
    if (typeof window !== 'undefined' && window.Booqable) {
      const possibleMethods = [
        ['cart', 'open'],
        ['cart', 'show'],
        ['cart', 'toggle'],
        ['shopping_cart', 'open'],
        ['shoppingCart', 'open'],
      ];

      let success = false;

      for (const [obj, method] of possibleMethods) {
        try {
          const target = (window.Booqable as any)[obj];
          if (target && typeof target[method] === 'function') {
            console.log(`[CartButton] Calling Booqable.${obj}.${method}()`);
            target[method]();
            success = true;
            break;
          }
        } catch (err) {
          console.error(`[CartButton] Failed to call ${obj}.${method}:`, err);
        }
      }

      if (!success) {
        console.warn('[CartButton] No cart open method found in Booqable API');
      }
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

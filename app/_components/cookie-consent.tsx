"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Settings, Cookie } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_PREFERENCES_KEY = "cookie-preferences";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Zawsze włączone - niezbędne do działania strony
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Sprawdź czy użytkownik już wyraził zgodę
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (!consent) {
      setShowBanner(true);
    } else if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const acceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allPreferences);
    saveConsent(allPreferences);
    setShowBanner(false);
    loadScripts(allPreferences);
  };

  const acceptSelected = () => {
    saveConsent(preferences);
    setShowBanner(false);
    setShowSettings(false);
    loadScripts(preferences);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
  };

  const loadScripts = (prefs: CookiePreferences) => {
    // Załaduj skrypty analityczne jeśli zgoda udzielona
    if (prefs.analytics && typeof window !== "undefined") {
      // Tutaj można załadować Google Analytics lub inne skrypty analityczne
      console.log("Analytics scripts loaded");
    }

    // Załaduj skrypty marketingowe jeśli zgoda udzielona
    if (prefs.marketing && typeof window !== "undefined") {
      // Tutaj można załadować skrypty marketingowe
      console.log("Marketing scripts loaded");
    }
  };

  const openSettings = () => {
    setShowSettings(true);
    setShowBanner(false);
  };

  const closeBanner = () => {
    setShowBanner(false);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  if (!showBanner && !showSettings) {
    // Pokaż przycisk ustawień w rogu ekranu
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="bg-background/90 backdrop-blur-sm border-border"
        >
          <Settings className="h-4 w-4 mr-2" />
          Cookies
        </Button>
      </div>
    );
  }

  // Główne okno zgody
  if (showBanner) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ta strona używa plików cookies
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Używamy plików cookies, aby zapewnić najlepsze doświadczenia na naszej stronie. 
                    Zgodnie z polskim prawem i RODO, potrzebujemy Twojej zgody na używanie niektórych cookies. 
                    Niezbędne cookies są zawsze włączone, ponieważ są wymagane do działania strony.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={acceptAll} className="flex-1">
                    Akceptuj wszystkie
                  </Button>
                  <Button variant="outline" onClick={openSettings} className="flex-1">
                    Dostosuj zgody
                  </Button>
                  <Button variant="ghost" size="sm" onClick={closeBanner}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Okno ustawień szczegółowych
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Cookie className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Ustawienia cookies</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={closeSettings}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Wybierz, które kategorie plików cookies chcesz zezwolić na tej stronie.
            </p>

            {/* Niezbędne cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Niezbędne cookies</h4>
                  <p className="text-xs text-muted-foreground">
                    Wymagane do działania strony - nie można ich wyłączyć
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="h-4 w-4 text-primary border-border rounded"
                />
              </div>
            </div>

            {/* Analityczne cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Analityczne cookies</h4>
                  <p className="text-xs text-muted-foreground">
                    Pomagają nam zrozumieć, jak korzystasz z naszej strony
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                />
              </div>
            </div>

            {/* Marketingowe cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Marketingowe cookies</h4>
                  <p className="text-xs text-muted-foreground">
                    Używane do personalizacji reklam i treści
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={acceptSelected} className="flex-1">
              Zapisz ustawienia
            </Button>
            <Button variant="outline" onClick={acceptAll} className="flex-1">
              Akceptuj wszystkie
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

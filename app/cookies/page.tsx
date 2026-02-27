import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Separator from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Polityka Cookies | Starkit",
  description: "Polityka plików cookies - informacje o używanych plikach cookies i ich celu",
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Polityka Plików Cookies
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Informacje o używanych plikach cookies, ich celu i możliwości zarządzania zgodami
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Czym są cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Czym są pliki cookies?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Pliki cookies (ciasteczka) to małe pliki tekstowe, które są zapisywane na urządzeniu użytkownika 
                podczas przeglądania stron internetowych. Służą do przechowywania informacji o preferencjach, 
                sesji i działaniach użytkownika w celu zapewnienia lepszej funkcjonalności i personalizacji usług.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Zgodnie z polskim prawem (Ustawa o świadczeniu usług drogą elektroniczną z dnia 18 lipca 2002 r.) 
                oraz RODO, przedstawiamy szczegółowe informacje o używanych plikach cookies.
              </p>
            </CardContent>
          </Card>

          {/* Rodzaje cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Rodzaje używanych plików cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Niezbędne */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Niezbędne cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Wymagane do prawidłowego działania strony i podstawowych funkcji. Są zawsze aktywne.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Utrzymywanie sesji użytkownika</li>
                  <li>Zapamiętywanie preferencji (np. tryb dark/light)</li>
                  <li>Zapamiętywanie zgody na cookies</li>
                  <li>Zapewnienie bezpieczeństwa i ochrony przed atakami</li>
                </ul>
              </div>

              <Separator />

              {/* Analityczne */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Analityczne cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Pomagają nam zrozumieć, jak użytkownicy korzystają ze strony, aby ją ulepszyć.
                  Wymagają zgody użytkownika.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Statystyki odwiedzin i czasu spędzonego na stronie</li>
                  <li>Informacje o popularnych podstronach</li>
                  <li>Dane geograficzne (ogólne)</li>
                  <li>Informacje o urządzeniach i przeglądarkach</li>
                </ul>
              </div>

              <Separator />

              {/* Marketingowe */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Marketingowe cookies</h3>
                <p className="text-sm text-muted-foreground">
                  Używane do personalizacji reklam i treści marketingowych. Wymagają zgody użytkownika.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Personalizacja reklam na podstawie zachowań</li>
                  <li>Mierzenie skuteczności kampanii marketingowych</li>
                  <li>Retargeting i remarketing</li>
                  <li>Integracja z zewnętrznymi platformami reklamowymi</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Zarządzanie cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Zarządzanie plikami cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Masz pełną kontrolę nad plikami cookies. Możesz w każdej chwili:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li><strong>Zmienić ustawienia zgody</strong> - kliknij przycisk "Cookies" w prawym dolnym rogu strony</li>
                <li><strong>Wyczyścić cookies</strong> - użyj ustawień przeglądarki</li>
                <li><strong>Blokować cookies</strong> - skonfiguruj ustawienia przeglądarki</li>
                <li><strong>Wycofać zgodę</strong> - zmień ustawienia w dowolnym momencie</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Uwaga:</strong> Zablokowanie lub usunięcie niezbędnych plików cookies może wpłynąć 
                na funkcjonalność strony.
              </p>
            </CardContent>
          </Card>

          {/* Okres przechowywania */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Okres przechowywania danych</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Różne rodzaje plików cookies mają różne okresy ważności:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li><strong>Sesyjne cookies</strong> - usuwane po zamknięciu przeglądarki</li>
                <li><strong>Tymczasowe cookies</strong> - usuwane po określonym czasie (np. 24 godziny, 7 dni)</li>
                <li><strong>Trwałe cookies</strong> - przechowywane dłużej (np. 1 rok) dla zapamiętania preferencji</li>
              </ul>
            </CardContent>
          </Card>

          {/* Podstawa prawna */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Podstawa prawna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Przetwarzanie danych za pomocą plików cookies odbywa się na podstawie:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li><strong>Ustawa z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną</strong> - art. 173-174</li>
                <li><strong>RODO (GDPR)</strong> - art. 6 ust. 1 lit. a (zgoda) oraz art. 7 (warunki zgody)</li>
                <li><strong>Dyrektywa o prywatności i komunikacji elektronicznej (ePrivacy)</strong></li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Zgoda na cookies jest dobrowolna, ale jej brak może ograniczyć niektóre funkcje strony.
              </p>
            </CardContent>
          </Card>

          {/* Kontakt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Kontakt w sprawach cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Jeśli masz pytania dotyczące naszej polityki cookies lub zarządzania danymi osobowymi, 
                skontaktuj się z nami:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> wynajem@starkit.pl</p>
                <p><strong>Godziny pracy:</strong> Poniedziałek - Piątek, 9:00 - 17:00</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Możesz również skorzystać z przycisku "Cookies" na stronie, aby zmienić ustawienia 
                zgody w dowolnym momencie.
              </p>
            </CardContent>
          </Card>

          {/* Aktualizacje */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Aktualizacje polityki</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Niniejsza polityka może być okresowo aktualizowana w związku ze zmianami 
                w prawodawstwie, funkcjonalnościach strony lub praktykach dotyczących prywatności. 
                O znaczących zmianach będziemy informować użytkowników na stronie.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Ostatnia aktualizacja:</strong> {new Date().toLocaleDateString('pl-PL')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type HowToSchemaProps = {
  productName: string;
  productSlug: string;
};

export default function HowToSchema({ productName, productSlug }: HowToSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const productUrl = `${baseUrl}/products/${productSlug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Jak wynająć ${productName}?`,
    description: `Wynajem ${productName} krok po kroku – od wyboru terminu po odbiór sprzętu w 24 godziny.`,
    totalTime: "PT5M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "PLN",
      value: productSlug === "starlink-mini" ? "39" : "59",
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Wybierz zestaw i termin",
        text: `Wejdź na stronę ${productUrl} i wybierz daty wynajmu ${productName}. Minimalne zamówienie to 3 dni.`,
        url: productUrl,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Złóż rezerwację online",
        text: "Podaj dane kontaktowe, adres dostawy i opłać zamówienie. Akceptujemy karty płatnicze i przelewy.",
        url: `${baseUrl}/checkout`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Odbierz sprzęt w 24h",
        text: "Wysyłamy zestaw kurierem InPost lub do paczkomatu. Sprzęt dotrze gotowy do użycia w ciągu 24-48 godzin.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Podłącz i korzystaj",
        text: `Plug & Play – postaw antenę ${productName}, podłącz zasilanie i ciesz się szybkim internetem satelitarnym w kilka minut.`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

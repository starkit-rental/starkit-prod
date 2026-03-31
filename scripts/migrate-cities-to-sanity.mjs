/**
 * Migrate city pages to Sanity CMS
 * Uploads hero images and creates cityPage documents
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const config = JSON.parse(
  readFileSync(join(process.env.HOME, ".config/sanity/config.json"), "utf-8")
);
const client = createClient({
  projectId: "xcahfs5n",
  dataset: "production",
  token: config.authToken,
  apiVersion: "2024-10-18",
  useCdn: false,
});

const k = () => randomUUID().slice(0, 12);

const cities = [
  {
    city: "Poznań",
    slug: "poznan",
    region: "wielkopolskie",
    headline: "Wynajem Starlink w Poznaniu",
    excerpt: "Szybki internet satelitarny Starlink w Poznaniu. Odbiór osobisty lub wysyłka. Idealne rozwiązanie na eventy, budowy i miejsca bez dostępu do internetu.",
    deliveryMethod: "pickup_and_shipping",
    imagePath: "public/images/cities/poznan.jpg",
  },
  {
    city: "Warszawa",
    slug: "warszawa",
    region: "mazowieckie",
    headline: "Wynajem Starlink w Warszawie",
    excerpt: "Profesjonalny wynajem Starlink w Warszawie. Szybka dostawa kurierem lub do paczkomatu InPost. Internet satelitarny do 350 Mbps.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/warszawa.jpg",
  },
  {
    city: "Kraków",
    slug: "krakow",
    region: "małopolskie",
    headline: "Wynajem Starlink w Krakowie",
    excerpt: "Wynajem internetu satelitarnego Starlink w Krakowie. Dostawa kurierem DPD lub do paczkomatu InPost. Prędkość do 350 Mbps.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/krakow.jpg",
  },
  {
    city: "Wrocław",
    slug: "wroclaw",
    region: "dolnośląskie",
    headline: "Wynajem Starlink we Wrocławiu",
    excerpt: "Starlink na wynajem we Wrocławiu. Szybka wysyłka kurierem lub do paczkomatu. Internet satelitarny dla eventów, budów i firm.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/wroclaw.jpg",
  },
  {
    city: "Gdańsk",
    slug: "gdansk",
    region: "pomorskie",
    headline: "Wynajem Starlink w Gdańsku",
    excerpt: "Wynajem Starlink w Gdańsku i Trójmieście. Dostawa kurierem lub do paczkomatu InPost. Niezawodny internet satelitarny.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/gdansk.jpg",
  },
  {
    city: "Katowice",
    slug: "katowice",
    region: "śląskie",
    headline: "Wynajem Starlink w Katowicach",
    excerpt: "Starlink w Katowicach - wynajem internetu satelitarnego. Wysyłka kurierem lub do paczkomatu. Prędkość do 350 Mbps.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/katowice.jpg",
  },
  {
    city: "Łódź",
    slug: "lodz",
    region: "łódzkie",
    headline: "Wynajem Starlink w Łodzi",
    excerpt: "Profesjonalny wynajem Starlink w Łodzi. Szybka dostawa kurierem lub do paczkomatu InPost. Internet satelitarny na eventy i budowy.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/lodz.jpg",
  },
  {
    city: "Szczecin",
    slug: "szczecin",
    region: "zachodniopomorskie",
    headline: "Wynajem Starlink w Szczecinie",
    excerpt: "Wynajem internetu satelitarnego Starlink w Szczecinie. Dostawa kurierem lub do paczkomatu. Niezawodne połączenie do 350 Mbps.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/szczecin.jpg",
  },
  {
    city: "Lublin",
    slug: "lublin",
    region: "lubelskie",
    headline: "Wynajem Starlink w Lublinie",
    excerpt: "Starlink na wynajem w Lublinie. Wysyłka kurierem DPD lub do paczkomatu InPost. Internet satelitarny dla firm i eventów.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/lublin.jpg",
  },
  {
    city: "Bydgoszcz",
    slug: "bydgoszcz",
    region: "kujawsko-pomorskie",
    headline: "Wynajem Starlink w Bydgoszczy",
    excerpt: "Wynajem Starlink w Bydgoszczy. Szybka dostawa kurierem lub do paczkomatu. Internet satelitarny do 350 Mbps.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/bydgoszcz.jpg",
  },
  {
    city: "Rzeszów",
    slug: "rzeszow",
    region: "podkarpackie",
    headline: "Wynajem Starlink w Rzeszowie",
    excerpt: "Profesjonalny wynajem Starlink w Rzeszowie. Dostawa kurierem lub do paczkomatu InPost. Niezawodny internet satelitarny.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/rzeszow.jpg",
  },
  {
    city: "Toruń",
    slug: "torun",
    region: "kujawsko-pomorskie",
    headline: "Wynajem Starlink w Toruniu",
    excerpt: "Starlink w Toruniu - wynajem internetu satelitarnego. Wysyłka kurierem lub do paczkomatu. Prędkość do 350 Mbps.",
    deliveryMethod: "shipping_only",
    imagePath: "public/images/cities/torun.jpg",
  },
];

async function uploadImage(imagePath) {
  const buffer = readFileSync(imagePath);
  const filename = imagePath.split("/").pop();
  
  const asset = await client.assets.upload("image", buffer, {
    filename,
  });
  
  return asset._id;
}

async function migrateCities() {
  console.log("Starting city pages migration to Sanity...\n");

  for (const cityData of cities) {
    console.log(`Processing ${cityData.city}...`);

    try {
      const imageAssetId = await uploadImage(cityData.imagePath);
      console.log(`  ✓ Uploaded image: ${imageAssetId}`);

      const doc = {
        _type: "cityPage",
        _id: `cityPage-${cityData.slug}`,
        city: cityData.city,
        slug: {
          _type: "slug",
          current: cityData.slug,
        },
        region: cityData.region,
        headline: cityData.headline,
        excerpt: cityData.excerpt,
        heroImage: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: imageAssetId,
          },
        },
        deliveryMethod: cityData.deliveryMethod,
        faqs: [],
        testimonials: [],
      };

      await client.createOrReplace(doc);
      console.log(`  ✓ Created/updated cityPage document\n`);
    } catch (error) {
      console.error(`  ✗ Error processing ${cityData.city}:`, error.message);
    }
  }

  console.log("Migration complete!");
}

migrateCities().catch(console.error);

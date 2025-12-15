import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { SingleProductQueryResult } from "@/sanity.types";
import { Home, Clapperboard, HardHat } from "lucide-react";
import Image from "next/image";

type StarlinkUseCasesProps = Extract<
  NonNullable<NonNullable<SingleProductQueryResult>["blocks"]>[number],
  { _type: "starlink-use-cases" }
>;

const useCases = [
  {
    icon: Home,
    title: "Domek letniskowy i działka",
    description:
      "Idealne rozwiązanie dla domków letniskowych, działek rekreacyjnych i chat górskich. Zapewnia stabilny internet dla całej rodziny podczas wakacji, umożliwia pracę zdalną z dowolnego miejsca i pozwala cieszyć się streamingiem w otoczeniu natury.",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop",
    alt: "Domek letniskowy z internetem satelitarnym",
  },
  {
    icon: Clapperboard,
    title: "Produkcja filmowa i eventy",
    description:
      "Profesjonalna łączność w terenie dla ekip filmowych, transmisji na żywo i eventów outdoorowych. Wysoka prędkość umożliwia przesyłanie plików 4K, wideokonferencje i współpracę online z każdego miejsca, nawet bez infrastruktury telekomunikacyjnej.",
    image: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=600&fit=crop",
    alt: "Produkcja filmowa w terenie z internetem satelitarnym",
  },
  {
    icon: HardHat,
    title: "Budowy i place budowy",
    description:
      "Tymczasowy internet dla placów budowy, kontenerów biurowych i ekip budowlanych. Umożliwia dostęp do planów, komunikację z biurem, zarządzanie projektem online i monitoring kamery bez potrzeby instalacji stałego łącza.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop",
    alt: "Plac budowy z mobilnym internetem",
  },
];

export default function StarlinkUseCases({
  padding,
  colorVariant,
  title,
}: StarlinkUseCasesProps) {
  const color = stegaClean(colorVariant);

  return (
    <SectionContainer color={color} padding={padding}>
      <div className="flex flex-col gap-12">
        {title && (
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Starlink Mini to uniwersalne rozwiązanie dla każdego, kto potrzebuje niezawodnego internetu poza zasięgiem tradycyjnych sieci
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                className="flex flex-col gap-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="relative w-full h-48 rounded-xl overflow-hidden">
                  <Image
                    src={useCase.image}
                    alt={useCase.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{useCase.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}

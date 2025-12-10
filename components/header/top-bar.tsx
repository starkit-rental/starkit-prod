import { Phone } from "lucide-react";

export default function TopBar() {
  return (
    <div className="w-full bg-black text-white py-3">
      <div className="container flex flex-col items-center justify-center gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span>Zapytaj o dostępność i cenę:</span>
          <a
            href="tel:+48453461061"
            className="font-semibold hover:underline inline-flex items-center gap-1"
          >
            <Phone className="w-4 h-4" />
            +48 453 461 061
          </a>
        </div>
        <div className="text-center text-yellow-400 font-semibold">
          Promocja! Zestaw Starlink Mini od dzisiaj do 27.12 w cenie{" "}
          <span className="line-through text-gray-400">900</span>{" "}
          <span className="text-white text-base">500 zł</span> za cały okres! Zadzwoń lub napisz!
        </div>
      </div>
    </div>
  );
}

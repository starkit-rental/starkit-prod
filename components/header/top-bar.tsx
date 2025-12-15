import { Phone } from "lucide-react";

export default function TopBar() {
  return (
    <div className="w-full bg-black text-white py-2">
      <div className="container flex items-center justify-center gap-2 text-sm">
        <span>Zapytaj o dostępność i cenę:</span>
        <a
          href="tel:+48453461061"
          className="font-semibold hover:underline inline-flex items-center gap-1"
        >
          <Phone className="w-4 h-4" />
          +48 453 461 061
        </a>
      </div>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import SmartsuppScript from "./smartsupp-script";

export default function ConditionalWidgets() {
  const pathname = usePathname();

  // Nie wyświetlaj widgetów na stronach /studio i /office
  if (pathname?.startsWith("/studio") || pathname?.startsWith("/office")) {
    return null;
  }

  return <SmartsuppScript />;
}

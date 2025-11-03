"use client";

import { usePathname } from "next/navigation";
import BooqableScript from "./booqable-script";
import SmartsuppScript from "./smartsupp-script";

export default function ConditionalWidgets() {
  const pathname = usePathname();

  // Nie wyświetlaj widgetów na stronach /studio
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <>
      <BooqableScript />
      <SmartsuppScript />
    </>
  );
}

"use client";

import Script from "next/script";

const SCRIPT_SRC =
  process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT ||
  "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js";

export default function BooqableScript() {
  return (
    <Script
      id="booqable-script"
      src={SCRIPT_SRC}
      strategy="lazyOnload"
      onLoad={() => {
        window.dispatchEvent(new Event("booqable:loaded"));
      }}
    />
  );
}

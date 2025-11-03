"use client";

import Script from "next/script";

declare global {
  interface Window {
    smartsupp?: (...args: any[]) => void;
    _smartsupp?: {
      key: string;
    };
  }
}

export default function SmartsuppScript() {
  return (
    <>
      <Script
        id="smartsupp-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
var _smartsupp = _smartsupp || {};
_smartsupp.key = '648f58784657a17d0881a0f17aa026a6e037acd3';
_smartsupp.offsetY = 100;
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);
          `,
        }}
      />
      <noscript>
        Powered by{" "}
        <a href="https://www.smartsupp.com" target="_blank" rel="noopener noreferrer">
          Smartsupp
        </a>
      </noscript>
    </>
  );
}

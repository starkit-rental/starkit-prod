// app/products/layout.tsx
import type { ReactNode } from "react";
import Header from "@/components/header";   // masz: components/header/index.tsx
import Footer from "@/components/footer";   // masz: components/footer.tsx

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </>
  );
}

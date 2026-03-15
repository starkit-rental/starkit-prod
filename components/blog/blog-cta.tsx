import ProductCardsGrid from "@/components/shared/product-cards-grid";

export default function BlogCTA() {
  return (
    <section className="w-full py-10 md:py-14">
      <div className="container">
        <ProductCardsGrid compact />
      </div>
    </section>
  );
}

import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/product/ProductCard";
import type { ProductCard as ProductCardType } from "@/types";

export default function ProductRail({
  eyebrow,
  title,
  description,
  products,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  products: ProductCardType[];
}) {
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-10 flex gap-5 sm:gap-6 overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-none">
        {products.map((p) => (
          <div key={p.id} className="w-[68vw] sm:w-[280px] shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

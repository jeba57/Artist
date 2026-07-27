import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/product/ProductCard";
import type { ProductCard as ProductCardType } from "@/types";

export default function FeaturedCollection({ products }: { products: ProductCardType[] }) {
  if (!products.length) return null;
  const [first, ...rest] = products;

  return (
    <section className="bg-stone-deep border-y border-stone-line">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Featured Collection"
          title="Pieces we keep returning to"
          description="A rotating selection, chosen for craftsmanship over trend — the ones our editors would buy for themselves."
        />
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          <div className="col-span-2 row-span-2">
            <ProductCard product={first} priority />
          </div>
          {rest.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

import type { ProductDetail } from "@/types";

export default function ProductStorySection({ product }: { product: ProductDetail }) {
  return (
    <section className="mt-16 grid lg:grid-cols-[1fr_320px] gap-12 border-t border-stone-line pt-12">
      <div>
        <p className="label-text text-terracotta mb-4">The Story</p>
        <p className="font-display text-xl sm:text-2xl leading-relaxed text-ink">{product.story}</p>

        <p className="label-text text-terracotta mt-10 mb-4">Craft Process</p>
        <ol className="space-y-3">
          {product.craftProcess.map((step, i) => (
            <li key={i} className="flex gap-4 text-sm text-ink-soft leading-relaxed">
              <span className="label-text text-ink-soft/40 shrink-0 w-6">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="label-text text-ink-soft/60 mb-3">Materials</p>
        <ul className="space-y-1.5">
          {product.materials.map((m) => (
            <li key={m} className="text-sm text-ink border-b border-stone-line pb-1.5">{m}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

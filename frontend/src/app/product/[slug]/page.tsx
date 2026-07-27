import { api } from "@/lib/api";
import type { ProductDetail, ProductCard as ProductCardType } from "@/types";
import { notFound } from "next/navigation";
import ProductGallery from "./ProductGallery";
import ProductPurchasePanel from "./ProductPurchasePanel";
import ProductStorySection from "./ProductStorySection";
import ReviewsSection from "./ReviewsSection";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import Image from "next/image";

async function getProduct(slug: string) {
  try {
    const res = await api.get<{ product: ProductDetail; similarProducts: ProductCardType[] }>(`/products/${slug}`);
    return res.data;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();

  const { product, similarProducts } = data;

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-14">
      <nav className="label-text text-ink-soft/50 mb-8">
        <Link href="/discover" className="hover:text-terracotta transition-colors">Discover</Link>
        <span className="mx-2">/</span>
        <Link href={`/discover?category=${product.category.slug}`} className="hover:text-terracotta transition-colors">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />
        <ProductPurchasePanel product={product} />
      </div>

      <ProductStorySection product={product} />

      {/* Seller profile */}
      <section className="mt-16 border-t border-stone-line pt-12">
        <p className="label-text text-terracotta mb-6">The Maker</p>
        <Link href={`/maker/${product.artisan.slug}`} className="flex items-center gap-5 group">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-stone-deep shrink-0">
            {product.artisan.avatarUrl && (
              <Image src={product.artisan.avatarUrl} alt={product.artisan.name} fill sizes="80px" className="object-cover" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-display text-xl text-ink group-hover:text-terracotta transition-colors">{product.artisan.name}</p>
              {product.artisan.verified && <BadgeCheck size={16} className="text-indigo" />}
            </div>
            <p className="label-text text-ink-soft/60 mt-1">{product.artisan.craftSpecialty} · {product.artisan.location}</p>
            <p className="mt-2 text-sm text-ink-soft max-w-xl leading-relaxed">{product.artisan.bio}</p>
          </div>
        </Link>
      </section>

      <ReviewsSection productId={product.id} />

      {similarProducts.length > 0 && (
        <section className="mt-16 border-t border-stone-line pt-12">
          <p className="label-text text-terracotta mb-6">You May Also Like</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

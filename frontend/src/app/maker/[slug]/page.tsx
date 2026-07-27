import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { ArtisanDetail, ProductCard as ProductCardType } from "@/types";
import ProductCard from "@/components/product/ProductCard";

interface MakerProfile extends ArtisanDetail {
  story: string | null;
  coverImageUrl: string | null;
  yearsOfExperience: number | null;
  rating: { avg: number; count: number };
}

async function getMaker(slug: string) {
  try {
    const res = await api.get<{ artisan: MakerProfile; products: ProductCardType[] }>(`/makers/${slug}`);
    return res.data;
  } catch {
    return null;
  }
}

export default async function MakerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getMaker(slug);
  if (!data) notFound();

  const { artisan, products } = data;

  return (
    <div>
      <div className="relative h-64 sm:h-80 bg-stone-deep">
        {artisan.coverImageUrl && (
          <Image src={artisan.coverImageUrl} alt="" fill sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-ink/30" />
      </div>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="-mt-16 relative flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-stone bg-stone-deep shrink-0">
            {artisan.avatarUrl && <Image src={artisan.avatarUrl} alt={artisan.name} fill sizes="128px" className="object-cover" />}
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl text-ink">{artisan.name}</h1>
              {artisan.verified && <BadgeCheck size={20} className="text-indigo" />}
            </div>
            <p className="label-text text-ink-soft/60 mt-1">
              {artisan.craftSpecialty} · {artisan.location}
              {artisan.yearsOfExperience ? ` · ${artisan.yearsOfExperience} years of practice` : ""}
            </p>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-[15px] text-ink-soft leading-relaxed">{artisan.story || artisan.bio}</p>

        <div className="mt-14 border-t border-stone-line pt-10 pb-20">
          <p className="label-text text-terracotta mb-6">Work by {artisan.name.split(" ")[0]}</p>
          {products.length === 0 ? (
            <p className="text-sm text-ink-soft/60">No pieces listed yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

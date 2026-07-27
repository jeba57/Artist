import { api } from "@/lib/api";
import Hero from "@/components/home/Hero";
import ProductRail from "@/components/home/ProductRail";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import CraftStoryBanner from "@/components/home/CraftStoryBanner";
import MeetTheMakers from "@/components/home/MeetTheMakers";
import Mission from "@/components/home/Mission";
import type { ProductCard, Maker } from "@/types";

async function getHomeData() {
  const [sectionsRes, makersRes] = await Promise.all([
    api
      .get<{ editorsPicks: ProductCard[]; featuredCollection: ProductCard[]; trending: ProductCard[] }>(
        "/products/home-sections"
      )
      .catch(() => ({ data: { editorsPicks: [], featuredCollection: [], trending: [] } })),
    api.get<Maker[]>("/makers/featured").catch(() => ({ data: [] as Maker[] })),
  ]);

  return { sections: sectionsRes.data, makers: makersRes.data };
}

export default async function Home() {
  const { sections, makers } = await getHomeData();

  return (
    <>
      <Hero />
      <ProductRail
        eyebrow="Editor's Picks"
        title="Curated for the discerning eye"
        description="Hand-selected each season by our editorial team, for craftsmanship that rewards a second look."
        products={sections.editorsPicks}
      />
      <FeaturedCollection products={sections.featuredCollection} />
      <CraftStoryBanner />
      <ProductRail
        eyebrow="Trending Now"
        title="What the room is drawn to"
        description="Ranked by what visitors linger on longest — a live pulse of the exhibition floor."
        products={sections.trending}
      />
      <MeetTheMakers makers={makers} />
      <Mission />
    </>
  );
}

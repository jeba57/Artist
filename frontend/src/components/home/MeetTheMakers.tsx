import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Maker } from "@/types";

export default function MeetTheMakers({ makers }: { makers: Maker[] }) {
  if (!makers.length) return null;

  return (
    <section id="makers" className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Meet the Makers"
        title="The hands behind the pieces"
        description="Every artisan on Artist is verified — their name and story travel with every piece they make."
      />
      <div className="mt-10 flex gap-8 overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0 scrollbar-none">
        {makers.map((m) => (
          <Link key={m.id} href={`/maker/${m.slug}`} className="group shrink-0 w-40 text-center">
            <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-stone-line group-hover:border-terracotta transition-colors">
              {m.avatar_url && (
                <Image src={m.avatar_url} alt={m.name} fill sizes="128px" className="object-cover" />
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1">
              <p className="font-display text-base text-ink">{m.name}</p>
              {m.verified && <BadgeCheck size={14} className="text-indigo" />}
            </div>
            <p className="label-text text-ink-soft/60 mt-0.5">{m.craft_specialty}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

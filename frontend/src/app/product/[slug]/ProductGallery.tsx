"use client";

import Image from "next/image";
import { useState } from "react";
import { cx } from "@/lib/format";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const shown = images.length ? images : [null];

  return (
    <div>
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-deep">
        {shown[active] && (
          <Image src={shown[active] as string} alt={name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={cx(
                "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors",
                active === i ? "border-terracotta" : "border-transparent"
              )}
            >
              <Image src={img} alt={`${name} view ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

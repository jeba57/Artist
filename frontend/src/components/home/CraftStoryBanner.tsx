import Image from "next/image";

export default function CraftStoryBanner() {
  return (
    <section className="relative h-[70vh] min-h-[420px] overflow-hidden">
      <Image
        src="https://source.unsplash.com/1600x900/?weaving,loom,artisan,hands&sig=storybanner"
        alt="An artisan's hands at work on a loom"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/20" />

      <div className="relative h-full mx-auto max-w-3xl px-6 flex flex-col items-center justify-center text-center">
        <p className="label-text text-turmeric">The Craft Story</p>
        <p className="mt-6 font-display text-2xl sm:text-4xl leading-snug text-stone">
          &ldquo;A machine can repeat a pattern. Only a hand can leave a signature — a thumbprint in
          the clay, a knot pulled just slightly tighter than the last.&rdquo;
        </p>
        <p className="mt-6 label-text text-stone/50">— Artist, on why we exist</p>
      </div>
    </section>
  );
}

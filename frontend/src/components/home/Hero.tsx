"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-stone-line">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 pb-0 sm:pt-20 grid lg:grid-cols-12 gap-10 items-end">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="lg:col-span-5 pb-14 sm:pb-20"
        >
          <p className="label-text text-terracotta">Stage 01 — A Living Exhibition</p>
          <h1 className="mt-5 font-display text-[2.6rem] sm:text-6xl leading-[1.04] text-ink">
            Handmade,
            <br />
            held in <em className="not-italic text-indigo">context.</em>
          </h1>
          <p className="mt-6 text-[15px] sm:text-base text-ink-soft leading-relaxed max-w-md">
            Every piece in this room was shaped by hand — by a potter in Khurja, a weaver in Kannur,
            a carver in Saharanpur. Walk through, and take home the story with the object.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 bg-ink text-stone px-6 py-3.5 rounded-full label-text hover:bg-indigo transition-colors"
            >
              Enter the Exhibition <ArrowRight size={14} />
            </Link>
            <Link href="#makers" className="label-text text-ink-soft hover:text-terracotta transition-colors">
              Meet the Makers
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="lg:col-span-7 relative"
        >
          <div className="grid grid-cols-5 gap-3 sm:gap-4">
            <div className="col-span-3 relative aspect-[3/4] rounded-t-[2.5rem] overflow-hidden">
              <Image
                src="https://source.unsplash.com/900x1200/?pottery,handmade,craft&sig=hero1"
                alt="Hand-thrown terracotta pottery"
                fill
                priority
                sizes="45vw"
                className="object-cover"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-3 sm:gap-4">
              <div className="relative aspect-square rounded-tr-[2rem] overflow-hidden">
                <Image
                  src="https://source.unsplash.com/600x600/?embroidery,textile,india&sig=hero2"
                  alt="Hand embroidery detail"
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-br-[1.5rem]">
                <Image
                  src="https://source.unsplash.com/600x750/?jewelry,silver,handcraft&sig=hero3"
                  alt="Handcrafted silver jewellery"
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

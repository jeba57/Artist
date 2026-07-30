"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-stone-line">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 grid md:grid-cols-12 gap-12 items-center min-h-[calc(100vh-90px)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="md:col-span-5"
        >
          <p className="label-text text-terracotta">Handcrafted by Indian Artisans</p>
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
              Enter the Exhibition <ArrowRight size={16} />
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
          className="md:col-span-7 relative"
        >
          <div className="grid grid-cols-5 gap-3 sm:gap-4">
            <div className="relative h-[250px] rounded-[28px] overflow-hidden bg-white shadow-sm border border-stone-200">
              <Image
                src="https://res.cloudinary.com/duu8hc93r/image/upload/v1785257845/4e27e088-7f98-4854-9211-fb1de4285dac_zs5kmm.jpg"
                alt="Hand-thrown terracotta pottery"
                fill
                priority
                sizes="45vw"
                className="object-cover bg-[#F7F1E5] p-4"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-3 sm:gap-4">
              <div className="relative h-[250px] rounded-tr-[2rem] overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/duu8hc93r/image/upload/v1785257865/b609a1ec-c785-4b4b-aeac-1c1d8c1eeb2d_wm6xql.jpg"
                  alt="Hand embroidery detail"
                  fill
                  sizes="20vw"
                  className="object-cover bg-[#F7F1E5] p-4"
                />
              </div>
              <div className="relative h-[250px] overflow-hidden rounded-br-[1.5rem]">
                <Image
                  src="https://res.cloudinary.com/duu8hc93r/image/upload/v1785257877/98cc00eb-f9ff-4aa4-a5e7-5298d8159507_s02k0c.jpg"
                  alt="Handcrafted silver jewellery"
                  fill
                  sizes="20vw"
                  className="object-cover bg-[#F7F1E5] p-4"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

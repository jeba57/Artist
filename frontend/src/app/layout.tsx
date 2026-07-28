import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import SiteChrome from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Artist — A Living Exhibition of Handmade India",
  description:
    "Artist is a curated digital exhibition of handmade crafts from Indian artisans — pottery, weaving, embroidery, and more, each piece carrying its maker's story.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,450;0,9..144,600;1,9..144,450&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-stone text-ink font-body">
        <AuthProvider>
          <CartProvider>
    <WishlistProvider>
      <SiteChrome>{children}</SiteChrome>
    </WishlistProvider>
  </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

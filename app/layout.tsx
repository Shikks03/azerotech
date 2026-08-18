import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import SceneBackground from "@/components/SceneBackground";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AzeroTech - Phone & Laptop Repair | Modern Repair Shop",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Professional phone repair, laptop reformat, and affordable accessories. Fast, reliable service for your devices.",
  openGraph: {
    title: "AzeroTech - Phone & Laptop Repair | Modern Repair Shop",
    description:
      "Professional phone repair, laptop reformat, and affordable accessories. Fast, reliable service for your devices.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.variable}>
        <SceneBackground />
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

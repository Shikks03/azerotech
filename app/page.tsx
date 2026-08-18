import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import JsonLd from "@/components/JsonLd";
import { localBusinessJsonLd, pageOpenGraph } from "@/lib/seo";

const title = "AzeroTech — Phone & Laptop Repair in Imus, Cavite";
const description =
  "Professional phone repair, laptop reformat, and affordable accessories in Imus, Cavite. Fast, reliable, and honest service, open Monday to Sunday.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: pageOpenGraph({ title, description, path: "/" }),
};

export default function Home() {
  return (
    <>
      <JsonLd data={localBusinessJsonLd} />
      <HomeClient />
    </>
  );
}

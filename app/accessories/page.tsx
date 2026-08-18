import type { Metadata } from "next";
import AccessoriesClient from "./AccessoriesClient";
import { pageOpenGraph } from "@/lib/seo";

const title = "Phone & Laptop Accessories";
const description =
  "Browse chargers, cables, earphones, keyboards, mice, and more in stock at AzeroTech's Imus, Cavite shop. Reserve items online for in-store pickup.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/accessories" },
  openGraph: pageOpenGraph({ title, description, path: "/accessories" }),
};

export default function AccessoriesPage() {
  return <AccessoriesClient />;
}

import type { Metadata } from "next";
import ServicesClient from "./ServicesClient";
import { pageOpenGraph } from "@/lib/seo";

const title = "Phone, Laptop & Computer Repair Services";
const description =
  "Screen replacement, charging fixes, full laptop and desktop reformats, and printing services at AzeroTech in Imus, Cavite. See what we repair and fix.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/services" },
  openGraph: pageOpenGraph({ title, description, path: "/services" }),
};

export default function ServicesPage() {
  return <ServicesClient />;
}

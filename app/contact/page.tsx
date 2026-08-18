import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import { pageOpenGraph } from "@/lib/seo";

const title = "Contact & Store Hours";
const description =
  "Reach AzeroTech in Imus, Cavite through Messenger or Instagram, get directions to the shop, and check store hours before you visit.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: pageOpenGraph({ title, description, path: "/contact" }),
};

export default function ContactPage() {
  return <ContactClient />;
}

import type { Metadata } from "next";
import RepairStatusClient from "./RepairStatusClient";
import { pageOpenGraph } from "@/lib/seo";

const title = "Track Your Repair Status";
const description =
  "Look up the live status of your phone or laptop repair at AzeroTech using your appointment ID.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/repair-status" },
  openGraph: pageOpenGraph({ title, description, path: "/repair-status" }),
};

export default function RepairStatusPage() {
  return <RepairStatusClient />;
}

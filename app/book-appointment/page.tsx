import type { Metadata } from "next";
import BookAppointmentClient from "./BookAppointmentClient";
import { pageOpenGraph } from "@/lib/seo";

const title = "Book a Repair Appointment";
const description =
  "Schedule a phone or laptop repair appointment online with AzeroTech in Imus, Cavite. Pick a service, date, and time in a few quick steps.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/book-appointment" },
  openGraph: pageOpenGraph({ title, description, path: "/book-appointment" }),
};

export default function BookAppointmentPage() {
  return <BookAppointmentClient />;
}

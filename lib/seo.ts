import type { Metadata } from "next";

export const SITE_URL = "https://azerotech.vercel.app";
export const SITE_NAME = "AzeroTech";

/**
 * Builds a complete `openGraph` object for a page's metadata export.
 *
 * Next.js merges `metadata` objects across a route's segments *shallowly* —
 * a page-level `openGraph` key fully replaces the layout's `openGraph`
 * object rather than merging field-by-field. So every page must supply the
 * whole object (siteName/locale/type included), not just the fields it
 * wants to override.
 */
export function pageOpenGraph({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): NonNullable<Metadata["openGraph"]> {
  return {
    title,
    description,
    url: `${SITE_URL}${path}`,
    siteName: SITE_NAME,
    locale: "en_PH",
    type: "website",
  };
}

/**
 * LocalBusiness structured data for AzeroTech.
 *
 * Every field here is a verified fact already present elsewhere in this
 * repo (contact page, homepage location card, Google Maps embeds) — no
 * telephone, price range, geo coordinates, or reviews are invented. See
 * AGENTS/task notes for the audit trail:
 * - address: the full street address shown on the homepage "Main Branch"
 *   location card (more specific than the footer's plus code).
 * - geo: lat/lng extracted from the Google Maps place link shared by the
 *   homepage and contact page (same Google place ID on both).
 * - openingHoursSpecification: the per-day hours from the contact page's
 *   "Store Hours" table (Mon-Fri differs from Sat-Sun).
 * - sameAs: the Messenger and Instagram links used elsewhere on the site.
 */
export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Phone repair, laptop and desktop reformatting, printing services, and affordable accessories in Imus, Cavite, Philippines.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "B39 L2 PH2 Greengate Homes, Malagasang 2-B",
    addressLocality: "Imus",
    addressRegion: "Cavite",
    postalCode: "4105",
    addressCountry: "PH",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 14.3712454,
    longitude: 120.9213543,
  },
  areaServed: "Imus, Cavite, Philippines",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "10:00",
      closes: "20:00",
    },
  ],
  sameAs: ["https://m.me/azerotech", "https://instagram.com/azerotech"],
};

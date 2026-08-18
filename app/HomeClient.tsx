"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  MessageCircle,
  MapPin,
  Smartphone,
  Monitor,
  ShoppingBag,
  Printer,
  Zap,
  Shield,
  Clock3,
  Star,
} from "lucide-react";
import { fadeUp, fadeUpView } from "@/lib/motion";
import SectionHeading from "@/components/SectionHeading";
import ServiceTile from "@/components/ServiceTile";
import FeatureTile from "@/components/FeatureTile";
import RepairTrackerCTA from "@/components/RepairTrackerCTA";
import ReviewCard from "@/components/ReviewCard";

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden flex flex-col justify-center"
        style={{ minHeight: "92vh" }}
      >
        {/* Hero Content */}
        <div className="relative flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 py-32 pb-44 max-w-5xl mx-auto w-full">
          {/* Badge */}
          <motion.div {...fadeUp(0)} className="mb-12">
            <span
              className="inline-flex items-center gap-2 border rounded-full px-5 py-2.5 text-sm"
              style={{
                background: "rgba(79,110,247,0.15)",
                borderColor: "rgba(79,110,247,0.3)",
                color: "#8B9EFF",
                fontWeight: 500,
              }}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              Imus, Cavite · Open 7 Days a Week
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.08)}
            className="text-white mb-8 max-w-3xl w-full"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.1 }}
          >
            We Fix What{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Matters Most
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...fadeUp(0.16)}
            className="text-slate-400 mb-14 max-w-xl w-full leading-relaxed"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)" }}
          >
            We repair phones, reformat laptops and computers, and offer
            affordable accessories — fast, reliable, and honest.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            {...fadeUp(0.24)}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto mb-20"
          >
            <Link
              href="/book-appointment"
              className="inline-flex items-center justify-center gap-2.5 text-white px-8 py-4 rounded-xl transition-all hover:opacity-90 w-full sm:w-auto"
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                fontWeight: 600,
                fontSize: "1.05rem",
                boxShadow: "0 8px 32px rgba(79,110,247,0.35)",
              }}
            >
              Book Appointment <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>
            <a
              href="https://m.me/azerotech"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 text-white px-8 py-4 rounded-xl transition-all hover:opacity-90 w-full sm:w-auto"
              style={{ background: "#0084FF", fontWeight: 500, fontSize: "1.05rem" }}
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              Messenger
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            {...fadeUp(0.32)}
            className="flex flex-wrap items-center justify-center gap-8 text-sm"
            style={{ color: "#94A3B8" }}
          >
            {[
              { Icon: Shield, text: "Quality Guaranteed" },
              { Icon: Clock3, text: "Fast Turnaround" },
              { Icon: Star, text: "Trusted by Locals" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 shrink-0" style={{ color: "#4F6EF7" }} />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-14 md:py-20 relative">
        <div className="flex flex-col max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          {/* Section Header */}
          <SectionHeading eyebrow="What We Offer" title="Our Main Services" subtitle="From cracked screens to slow laptops — we handle it all at an affordable price." className="mb-5" />

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-3">
            {[
              {
                Icon: Smartphone,
                title: "Phone Repair",
                desc: "LCD replacement, charging fix, button repair, reprogram, reformat, and more.",
                href: "/services#phone",
                color: "#4F6EF7",
                label: "Learn more",
                delay: 0,
              },
              {
                Icon: Monitor,
                title: "Laptop & Desktop",
                desc: "Full OS reformat and reinstallation for laptops and desktop computers.",
                href: "/services#laptop",
                color: "#06B6D4",
                label: "Learn more",
                delay: 0.08,
              },
              {
                Icon: Printer,
                title: "Printing Services",
                desc: "Document, photo, and ID printing — quick turnaround at affordable rates.",
                href: "/services#printing",
                color: "#F59E0B",
                label: "Learn more",
                delay: 0.16,
              },
              {
                Icon: ShoppingBag,
                title: "Accessories",
                desc: "Quality chargers, cables, earphones, keyboards, mice, and more in-store.",
                href: "/accessories",
                color: "#8B5CF6",
                label: "Check Accessories",
                delay: 0.24,
              },
            ].map((item) => (
              <motion.div key={item.title} {...fadeUpView(item.delay)} className="flex">
                <ServiceTile Icon={item.Icon} title={item.title} desc={item.desc} href={item.href} color={item.color} label={item.label} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY AZEROTECH ─── */}
      <section className="py-16 md:py-24 relative">
        <div className="flex flex-col max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          {/* Section Header */}
          <SectionHeading eyebrow="Why AzeroTech" title="Repairs You Can Trust" className="mb-20" />

          {/* Feature Cards */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch gap-8">
            {[
              { Icon: Zap,    title: "Fast Service",   desc: "Most repairs completed same day or within 24 hours.",                  delay: 0    },
              { Icon: Shield, title: "Quality Parts",  desc: "We use quality replacement parts for long-lasting results.",            delay: 0.06 },
              { Icon: Clock3, title: "Open Daily",     desc: "We're open Monday to Sunday, 9AM to 8PM.",                             delay: 0.12 },
              { Icon: Star,   title: "Affordable",     desc: "Fair, transparent pricing with no hidden fees.",                        delay: 0.18 },
            ].map((item) => (
              <motion.div
                key={item.title}
                {...fadeUpView(item.delay)}
                className="flex flex-col flex-1 basis-full sm:basis-[calc(50%-16px)] lg:basis-[calc(25%-24px)]"
              >
                <FeatureTile Icon={item.Icon} title={item.title} desc={item.desc} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <RepairTrackerCTA />

      {/* ─── LOCATIONS ─── */}
      <section className="py-16 md:py-24 relative">
        <div className="flex flex-col max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          {/* Section Header */}
          <SectionHeading eyebrow="Find Us" title="Visit Our Shop" className="mb-10" />

          {/* Location + Map */}
          <div className="flex flex-col lg:flex-row items-stretch gap-10">
            {/* Location Cards */}
            <div className="flex flex-col gap-6 w-full lg:w-2/5">
              <motion.div
                {...fadeUpView(0)}
                className="glass flex flex-col rounded-2xl p-8"
              >
                <div className="flex items-start gap-5">
                  <div className="p-3 rounded-xl shrink-0" style={{ background: "rgba(79,110,247,0.15)" }}>
                    <MapPin className="w-6 h-6 text-[#4F6EF7]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                        Main Branch
                      </h3>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80", fontWeight: 600 }}
                      >
                        Open
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">B39 L2 PH2 Greengate Homes Malagasang 2-B, Imus, Cavite, 4105</p>
                    <a
                      href="https://www.google.com/maps/place/Azerotech+Gadget+fix+%26+Printing+Services/@14.3712506,120.9221804,928m/data=!3m1!1e3!4m6!3m5!1s0x3397d3e8468e7917:0x6e2d9fc810571320!8m2!3d14.3712454!4d120.9213543!16s%2Fg%2F11j53q_t9x?entry=ttu&g_ep=EgoyMDI2MDMwNC4xIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm mt-2 hover:underline"
                      style={{ color: "#4F6EF7", fontWeight: 500 }}
                    >
                      Open in Maps <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                {...fadeUpView(0.08)}
                className="glass flex flex-col rounded-2xl p-8"
              >
                <div className="flex items-start gap-5">
                  <div className="p-3 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <MapPin className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                        Branch 2
                      </h3>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8", fontWeight: 600 }}
                      >
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Address available locally. Not yet on Google Maps.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div {...fadeUpView(0.16)}>
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                    fontWeight: 600,
                    boxShadow: "0 6px 24px rgba(79,110,247,0.25)",
                  }}
                >
                  Get Directions & Contact <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
              </motion.div>
            </div>

            {/* Map */}
            <motion.div
              {...fadeUpView(0.1)}
              className="glass flex flex-col flex-1 rounded-2xl overflow-hidden"
              style={{ minHeight: "480px" }}
            >
              <iframe
                title="AzeroTech Location – Imus, Cavite"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d600.7140514889592!2d120.92151418587893!3d14.37123738378802!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d3e8468e7917%3A0x6e2d9fc810571320!2sAzerotech%20Gadget%20fix%20%26%20Printing%20Services!5e1!3m2!1sen!2sph!4v1772956050218!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block", minHeight: "480px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CUSTOMER REVIEWS ─── */}
      <section className="py-16 md:py-24 relative">
        <div className="flex flex-col max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          <SectionHeading eyebrow="Customer Reviews" title="What Our Customers Say" className="mb-12" />
          <div className="flex flex-col md:flex-row items-stretch gap-6">
            {[
              { quote: "Best service ever! Fixed my cracked screen in under an hour and the price was fair.", name: "Sarah K.", meta: "Phone screen repair" },
              { quote: "Reformatted my old laptop and it runs like new. Highly recommend AzeroTech.", name: "Mark D.", meta: "Laptop reformat" },
              { quote: "Great selection of accessories and super knowledgeable, friendly staff.", name: "Jenny T.", meta: "Accessories" },
            ].map((r, i) => (
              <motion.div key={r.name} {...fadeUpView(i * 0.08)} className="flex">
                <ReviewCard quote={r.quote} name={r.name} meta={r.meta} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-36 md:py-44 relative">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto px-6 gap-8">
          <motion.h2 {...fadeUpView()} className="text-white" style={{ fontWeight: 700 }}>
            Ready to Fix Your Device?
          </motion.h2>
          <motion.p {...fadeUpView(0.08)} className="text-slate-400 max-w-sm">
            Book your appointment now — it only takes a minute.
          </motion.p>
          <motion.div {...fadeUpView(0.16)} className="mt-2">
            <Link
              href="/book-appointment"
              className="inline-flex items-center gap-2.5 text-white px-9 py-4 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                fontWeight: 600,
                fontSize: "1.05rem",
                boxShadow: "0 8px 32px rgba(79,110,247,0.35)",
              }}
            >
              Book an Appointment <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

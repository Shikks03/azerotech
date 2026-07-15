"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Phone,
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

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden flex flex-col justify-center"
        style={{
          background: "linear-gradient(135deg, #080B1A 0%, #0F1535 60%, #080B1A 100%)",
          minHeight: "92vh",
        }}
      >
        {/* Grid decoration */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow orbs */}
        <div
          className="absolute -top-32 -left-32 w-150 h-150 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #4F6EF7, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-100 h-100 rounded-full pointer-events-none"
          style={{ opacity: 0.08, background: "radial-gradient(circle, #06B6D4, transparent 70%)" }}
        />

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
              href="tel:+639000000000"
              className="inline-flex items-center justify-center gap-2.5 border text-white px-8 py-4 rounded-xl transition-all hover:bg-white/10 w-full sm:w-auto"
              style={{
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.15)",
                fontWeight: 500,
                fontSize: "1.05rem",
              }}
            >
              <Phone className="w-5 h-5 shrink-0" style={{ color: "#8B9EFF" }} />
              Call Shop
            </a>
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

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-16"
          >
            <path d="M0 64L1440 64L1440 32C1200 0 240 64 0 32L0 64Z" fill="#F7F8FF" />
          </svg>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-14 md:py-20" style={{ background: "#F7F8FF" }}>
        <div className="flex flex-col max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          {/* Section Header */}
          <motion.div {...fadeUpView()} className="flex flex-col items-center text-center mb-5">
            <span
              className="inline-block text-sm mb-3 uppercase tracking-widest"
              style={{ color: "#4F6EF7", fontWeight: 600 }}
            >
              What We Offer
            </span>
            <h2 className="text-[#0F172A] mb-3" style={{ fontWeight: 700 }}>
              Our Main Services
            </h2>
            <p className="text-slate-500 max-w-md">
              From cracked screens to slow laptops — we handle it all at an affordable price.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-3">
            {[
              {
                Icon: Smartphone,
                title: "Phone Repair",
                desc: "LCD replacement, charging fix, button repair, reprogram, reformat, and more.",
                href: "/services#phone",
                color: "#4F6EF7",
                bg: "#EEF1FF",
                label: "Learn more",
                delay: 0,
              },
              {
                Icon: Monitor,
                title: "Laptop & Desktop",
                desc: "Full OS reformat and reinstallation for laptops and desktop computers.",
                href: "/services#laptop",
                color: "#06B6D4",
                bg: "#ECFEFF",
                label: "Learn more",
                delay: 0.08,
              },
              {
                Icon: Printer,
                title: "Printing Services",
                desc: "Document, photo, and ID printing — quick turnaround at affordable rates.",
                href: "/services#printing",
                color: "#F59E0B",
                bg: "#FFFBEB",
                label: "Learn more",
                delay: 0.16,
              },
              {
                Icon: ShoppingBag,
                title: "Accessories",
                desc: "Quality chargers, cables, earphones, keyboards, mice, and more in-store.",
                href: "/accessories",
                color: "#8B5CF6",
                bg: "#F5F3FF",
                label: "Check Accessories",
                delay: 0.24,
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                {...fadeUpView(item.delay)}
                className="flex"
              >
                <Link href={item.href} className="flex flex-col h-full w-full">
                  <div
                    className="flex flex-col flex-1 bg-white rounded-2xl p-8 border border-slate-100 hover:border-transparent hover:shadow-xl transition-all duration-300 group cursor-pointer"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110 shrink-0"
                      style={{ background: item.bg }}
                    >
                      <item.Icon className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <h3 className="text-[#0F172A] mb-4" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                      {item.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-8">
                      {item.desc}
                    </p>
                    <span
                      className="inline-flex items-center gap-2 text-sm transition-all group-hover:gap-3"
                      style={{ color: item.color, fontWeight: 600 }}
                    >
                      {item.label} <ArrowRight className="w-4 h-4 shrink-0" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY AZEROTECH ─── */}
      <section className="py-16 md:py-24" style={{ background: "#080B1A" }}>
        <div className="flex flex-col max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          {/* Section Header */}
          <motion.div {...fadeUpView()} className="flex flex-col items-center text-center mb-20">
            <span
              className="inline-block text-sm mb-5 uppercase tracking-widest"
              style={{ color: "#8B9EFF", fontWeight: 600 }}
            >
              Why AzeroTech
            </span>
            <h2 className="text-white" style={{ fontWeight: 700 }}>
              Repairs You Can Trust
            </h2>
          </motion.div>

          {/* Feature Cards */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch gap-8">
            {[
              { Icon: Zap,    title: "Fast Service",   desc: "Most repairs completed same day or within 24 hours.",                  delay: 0    },
              { Icon: Shield, title: "Quality Parts",  desc: "We use quality replacement parts for long-lasting results.",            delay: 0.06 },
              { Icon: Clock3, title: "Open Daily",     desc: "We're open Monday to Sunday, 9AM to 7PM.",                             delay: 0.12 },
              { Icon: Star,   title: "Affordable",     desc: "Fair, transparent pricing with no hidden fees.",                        delay: 0.18 },
            ].map((item) => (
              <motion.div
                key={item.title}
                {...fadeUpView(item.delay)}
                className="flex flex-col flex-1 basis-full sm:basis-[calc(50%-16px)] lg:basis-[calc(25%-24px)] rounded-2xl p-10 transition-all duration-300 group"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-8 transition-colors duration-300 group-hover:bg-[#4F6EF7]/25 shrink-0"
                  style={{ background: "rgba(79,110,247,0.15)" }}
                >
                  <item.Icon className="w-6 h-6" style={{ color: "#8B9EFF" }} />
                </div>
                <h4 className="text-white mb-4" style={{ fontWeight: 600, fontSize: "1rem" }}>
                  {item.title}
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LOCATIONS ─── */}
      <section className="py-16 md:py-24" style={{ background: "#F7F8FF" }}>
        <div className="flex flex-col max-w-6xl mx-auto px-6 sm:px-10 lg:px-12">
          {/* Section Header */}
          <motion.div {...fadeUpView()} className="flex flex-col items-center text-center mb-10">
            <span
              className="inline-block text-sm mb-5 uppercase tracking-widest"
              style={{ color: "#4F6EF7", fontWeight: 600 }}
            >
              Find Us
            </span>
            <h2 className="text-[#0F172A]" style={{ fontWeight: 700 }}>
              Visit Our Shop
            </h2>
          </motion.div>

          {/* Location + Map */}
          <div className="flex flex-col lg:flex-row items-stretch gap-10">
            {/* Location Cards */}
            <div className="flex flex-col gap-6 w-full lg:w-2/5">
              <motion.div
                {...fadeUpView(0)}
                className="flex flex-col bg-white rounded-2xl p-8 border border-slate-100"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-start gap-5">
                  <div className="bg-[#EEF1FF] p-3 rounded-xl shrink-0">
                    <MapPin className="w-6 h-6 text-[#4F6EF7]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#0F172A]" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                        Main Branch
                      </h3>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "#DCFCE7", color: "#15803D", fontWeight: 600 }}
                      >
                        Open
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">B39 L2 PH2 Greengate Homes Malagasang 2-B, Imus, Cavite, 4105</p>
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
                className="flex flex-col bg-white rounded-2xl p-8 border border-slate-100"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-start gap-5">
                  <div className="bg-slate-100 p-3 rounded-xl shrink-0">
                    <MapPin className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#0F172A]" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                        Branch 2
                      </h3>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "#F1F5F9", color: "#64748B", fontWeight: 600 }}
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
              className="flex flex-col flex-1 bg-white rounded-2xl overflow-hidden border border-slate-100"
              style={{ minHeight: "480px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
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

      {/* ─── CTA ─── */}
      <section
        className="py-36 md:py-44"
        style={{ background: "linear-gradient(135deg, #080B1A 0%, #0F1535 100%)" }}
      >
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
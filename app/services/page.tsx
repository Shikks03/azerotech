"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Smartphone,
  Monitor,
  ShoppingBag,
  CheckCircle2,
  Printer,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease },
});

const fadeUpView = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease },
});

type ServiceCategory = {
  id: string;
  label: string;
  Icon: React.ElementType;
  count: number;
  accentBg: string;
  accentColor: string;
  buttonBg: string;
  buttonShadow: string;
  buttonLabel: string;
  href: string;
  services: string[];
  twoColumn?: boolean;
};

const serviceCategories: ServiceCategory[] = [
  {
    id: "phone",
    label: "Cellphone Repair",
    Icon: Smartphone,
    count: 18,
    accentBg: "#EEF1FF",
    accentColor: "#4F6EF7",
    buttonBg: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
    buttonShadow: "0 6px 20px rgba(79,110,247,0.35)",
    buttonLabel: "Book Phone Repair",
    href: "/book-appointment",
    twoColumn: true,
    services: [
      "LCD Replacement",
      "Google Account Bypass",
      "iCloud Account Bypass",
      "Reprogram",
      "Reformat",
      "Hang Logo",
      "Auto Restart",
      "Auto Shutdown",
      "No Power",
      "Not Charging",
      "Power Button",
      "Volume Buttons",
      "Speaker / Mic Problem",
      "No Service / Network Problem",
      "Openline",
      "Shorted",
      "Wi-Fi / Bluetooth Problem",
      "Water Damage",
    ],
  },
  {
    id: "printing",
    label: "Printing Services",
    Icon: Printer,
    count: 22,
    accentBg: "#FFF7ED",
    accentColor: "#F97316",
    buttonBg: "linear-gradient(135deg, #F97316, #FB923C)",
    buttonShadow: "0 6px 20px rgba(249,115,22,0.3)",
    buttonLabel: "Inquire About Printing",
    href: "/contact",
    twoColumn: true,
    services: [
      "Bag Tag",
      "Brochure",
      "Calling Card",
      "Document Printing",
      "Flyers",
      "Invitation",
      "Keychains",
      "Laminate",
      "Laminated ID",
      "Name Tag",
      "Note Pad / Memo Pad",
      "Notebook & Book Label",
      "Perforated Tickets",
      "Personalized Mugs",
      "Photo Magnet",
      "Photo Print – Wallet / 3R / 4R / 5R / 8R",
      "PVC ID",
      "Rush ID – 1x1 / 2x2 / Passport",
      "Sticker Label",
      "Tarpaulin",
      "Thank You Tag",
      "T-shirt Printing",
    ],
  },
  {
    id: "laptop",
    label: "Laptop / Desktop",
    Icon: Monitor,
    count: 16,
    accentBg: "#E0FAFA",
    accentColor: "#06B6D4",
    buttonBg: "linear-gradient(135deg, #06B6D4, #22D3EE)",
    buttonShadow: "0 6px 20px rgba(6,182,212,0.3)",
    buttonLabel: "Book PC / Laptop Repair",
    href: "/book-appointment",
    twoColumn: true,
    services: [
      "Reformat",
      "Install MS Office",
      "Install Windows 10 / 11",
      "Activate MS Office",
      "Activate Windows",
      "Blue Screen",
      "Auto Restart",
      "Auto Shutdown",
      "LCD Screen Replacement",
      "No Display",
      "No Power",
      "Not Charging",
      "Overheating Issue",
      "Stuck on Windows Logo",
      "Upgrade HDD to SSD",
      "Water Damage",
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    Icon: ShoppingBag,
    count: 8,
    accentBg: "#F5F3FF",
    accentColor: "#8B5CF6",
    buttonBg: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    buttonShadow: "0 6px 20px rgba(139,92,246,0.3)",
    buttonLabel: "Browse Accessories",
    href: "/accessories",
    services: [
      "Charger",
      "Data Cable",
      "Earphones",
      "Keyboard",
      "Memory Cards",
      "Mouse",
      "Tempered Glass",
      "USB Flash Drive",
    ],
  },
];

export default function Services() {
  return (
    <div className="flex flex-col">

      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden flex flex-col justify-center"
        style={{
          background: "linear-gradient(135deg, #080B1A 0%, #0F1535 60%, #080B1A 100%)",
          minHeight: "60vh",
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

        <div className="relative flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 py-28 pb-40 max-w-4xl mx-auto w-full">
          {/* Badge */}
          <motion.div {...fadeUp(0)} className="mb-10">
            <span
              className="inline-flex items-center gap-2 border rounded-full px-5 py-2.5 text-sm"
              style={{
                background: "rgba(79,110,247,0.15)",
                borderColor: "rgba(79,110,247,0.3)",
                color: "#8B9EFF",
                fontWeight: 500,
              }}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              Cellphones · Laptops · Accessories
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.08)}
            className="text-white mb-6 max-w-2xl w-full"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 700, lineHeight: 1.1 }}
          >
            Our{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Services
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...fadeUp(0.16)}
            className="text-slate-400 max-w-xl w-full leading-relaxed"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)" }}
          >
            Professional repair and maintenance services for all your devices — fast, reliable, and affordable.
          </motion.p>
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

      {/* ─── SERVICE CARDS ─── */}
      <section className="py-16 md:py-24" style={{ background: "#F7F8FF" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {serviceCategories.map((cat, catIdx) => (
              <motion.div
                key={cat.id}
                {...fadeUpView(catIdx * 0.1)}
                className="flex flex-col rounded-2xl overflow-hidden border border-slate-100"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
              >
                {/* Card Header */}
                <div
                  className="flex items-center gap-5 px-8 py-7"
                  style={{ background: cat.accentBg }}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "white" }}
                  >
                    <cat.Icon className="w-7 h-7" style={{ color: cat.accentColor }} />
                  </div>
                  <div>
                    <p className="font-bold text-[#0F172A] text-xl leading-tight">{cat.label}</p>
                    <p className="text-base font-medium mt-0.5" style={{ color: cat.accentColor }}>
                      {cat.count} {cat.count === 1 ? "service" : "services"}
                    </p>
                  </div>
                </div>

                {/* Service List */}
                <div className="flex flex-col flex-1 bg-white px-8 py-6">
                  <div className={cat.twoColumn ? "grid grid-cols-2 gap-x-4 gap-y-3" : "flex flex-col gap-4"}>
                    {cat.services.map((svc) => (
                      <div key={svc} className="flex items-center gap-2.5">
                        <CheckCircle2
                          className="w-4 h-4 shrink-0"
                          style={{ color: cat.accentColor }}
                        />
                        <span className={`text-[#0F172A] ${cat.twoColumn ? "text-sm" : "text-base"}`}>{svc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="bg-white px-8 pb-8">
                  <Link
                    href={cat.href}
                    className="flex items-center justify-center gap-2 w-full text-white py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90"
                    style={{
                      background: cat.buttonBg,
                      boxShadow: cat.buttonShadow,
                    }}
                  >
                    {cat.buttonLabel} <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                </div>
              </motion.div>
            ))}
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
            Have Questions? Let&apos;s Help
          </motion.h2>
          <motion.p {...fadeUpView(0.08)} className="text-slate-400 max-w-sm">
            Book your appointment now or reach out — we&apos;re happy to assist.
          </motion.p>
          <motion.div
            {...fadeUpView(0.16)}
            className="flex flex-col sm:flex-row items-center gap-4 mt-2"
          >
            <Link
              href="/book-appointment"
              className="inline-flex items-center gap-2.5 text-white px-8 py-4 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                fontWeight: 600,
                fontSize: "1.05rem",
                boxShadow: "0 8px 32px rgba(79,110,247,0.35)",
              }}
            >
              Book Service <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 border text-white px-8 py-4 rounded-xl transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.15)",
                fontWeight: 500,
                fontSize: "1.05rem",
              }}
            >
              Contact Us
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

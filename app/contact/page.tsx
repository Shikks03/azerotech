"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Phone,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { fadeUp, fadeUpView } from "@/lib/motion";
import ContactForm from "@/components/ContactForm";

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

const hours = [
  { day: "Monday",    time: "9:00 AM – 6:00 PM" },
  { day: "Tuesday",   time: "9:00 AM – 6:00 PM" },
  { day: "Wednesday", time: "9:00 AM – 6:00 PM" },
  { day: "Thursday",  time: "9:00 AM – 6:00 PM" },
  { day: "Friday",    time: "9:00 AM – 6:00 PM" },
  { day: "Saturday",  time: "10:00 AM – 5:00 PM" },
  { day: "Sunday",    time: "10:00 AM – 5:00 PM" },
];

const contactMethods = [
  {
    Icon: Phone,
    label: "Call Us",
    detail: "+63 912 345 6789",
    sub: "Available during store hours",
    href: "tel:+639123456789",
    accentBg: "#EEF1FF",
    accentColor: "#4F6EF7",
    actionLabel: "Call Now",
  },
  {
    Icon: MessageCircle,
    label: "Messenger",
    detail: "AzeroTech",
    sub: "Chat with us anytime",
    href: "https://m.me/azerotech",
    accentBg: "#E0F2FE",
    accentColor: "#0084FF",
    actionLabel: "Message Now",
  },
  {
    Icon: MapPin,
    label: "Visit Us",
    detail: "Imus, Cavite",
    sub: "B39 L2 PH2 Greengate Homes",
    href: "https://www.google.com/maps/place/Azerotech+Gadget+fix+%26+Printing+Services/@14.3712506,120.9221804,928m/data=!3m1!1e3!4m6!3m5!1s0x3397d3e8468e7917:0x6e2d9fc810571320!8m2!3d14.3712454!4d120.9213543!16s%2Fg%2F11j53q_t9x",
    accentBg: "#DCFCE7",
    accentColor: "#16A34A",
    actionLabel: "Get Directions",
  },
  {
    Icon: InstagramIcon,
    label: "Instagram",
    detail: "@azerotech",
    sub: "Follow us for updates",
    href: "https://instagram.com/azerotech",
    accentBg: "#FDF2F8",
    accentColor: "#C026D3",
    actionLabel: "Follow Us",
  },
];

export default function Contact() {
  return (
    <div className="flex flex-col">

      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden flex flex-col justify-center"
        style={{
          background: "transparent",
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
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              Imus, Cavite · Open 7 Days a Week
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="text-white mb-6 max-w-2xl w-full"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 700, lineHeight: 1.1 }}
          >
            Get in{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Touch
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            className="text-slate-400 max-w-xl w-full leading-relaxed"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)" }}
          >
            We&apos;re here to help — reach out any way that&apos;s convenient for you.
          </motion.p>
        </div>

      </section>

      {/* ─── CONTACT + MAP ─── */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col lg:flex-row items-stretch gap-10">

            {/* Contact Cards */}
            <div className="flex flex-col gap-5 w-full lg:w-2/5">
              {contactMethods.map((method, idx) => (
                <motion.a
                  key={method.label}
                  {...fadeUpView(idx * 0.07)}
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-5 glass glass-hover rounded-2xl px-6 py-5 transition-all duration-300 group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "rgba(79,110,247,0.15)" }}
                  >
                    <method.Icon className="w-5 h-5" style={{ color: method.accentColor }} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{method.label}</p>
                    <p className="text-white font-bold text-base truncate">{method.detail}</p>
                    <p className="text-slate-400 text-xs">{method.sub}</p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-semibold shrink-0 transition-all group-hover:gap-2"
                    style={{ color: method.accentColor }}
                  >
                    {method.actionLabel} <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </span>
                </motion.a>
              ))}
            </div>

            {/* Map */}
            <motion.div
              {...fadeUpView(0.1)}
              className="flex flex-col flex-1 glass rounded-2xl overflow-hidden"
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

      <ContactForm />

      {/* ─── STORE HOURS ─── */}
      <section className="py-16 md:py-24" style={{ background: "transparent" }}>
        <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12">
          <motion.div {...fadeUpView()} className="flex flex-col items-center text-center mb-12">
            <span
              className="inline-block text-sm mb-5 uppercase tracking-widest"
              style={{ color: "#8B9EFF", fontWeight: 600 }}
            >
              Store Hours
            </span>
            <h2 className="text-white" style={{ fontWeight: 700 }}>
              When to Visit
            </h2>
          </motion.div>

          <motion.div
            {...fadeUpView(0.08)}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {hours.map((h, idx) => {
              const isToday = h.day === today;
              return (
                <div
                  key={h.day}
                  className="flex items-center justify-between px-7 py-4"
                  style={{
                    background: isToday
                      ? "rgba(79,110,247,0.18)"
                      : idx % 2 === 0
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(255,255,255,0.06)",
                    borderBottom: idx < hours.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-semibold"
                      style={{ color: isToday ? "#8B9EFF" : "#CBD5E1" }}
                    >
                      {h.day}
                    </span>
                    {isToday && (
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                        style={{ background: "#4F6EF7", color: "white" }}
                      >
                        Today
                      </span>
                    )}
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: isToday ? "#A5B4FC" : "#64748B" }}
                  >
                    {h.time}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section
        className="py-36 md:py-44"
        style={{ background: "transparent" }}
      >
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto px-6 gap-8">
          <motion.h2 {...fadeUpView()} className="text-white" style={{ fontWeight: 700 }}>
            Ready to Get Started?
          </motion.h2>
          <motion.p {...fadeUpView(0.08)} className="text-slate-400 max-w-sm">
            Book an appointment now or give us a call — we&apos;re happy to help.
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
              Book Appointment <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>
            <a
              href="tel:+639123456789"
              className="inline-flex items-center gap-2.5 border text-white px-8 py-4 rounded-xl transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.15)",
                fontWeight: 500,
                fontSize: "1.05rem",
              }}
            >
              <Phone className="w-5 h-5 shrink-0" style={{ color: "#8B9EFF" }} />
              Call Us
            </a>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

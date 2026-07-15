"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Send, Check } from "lucide-react";
import { fadeUpView } from "@/lib/motion";

const MESSENGER_URL = "https://m.me/azerotech";

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#E2E8F0",
} as const;

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const update =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const composed =
      `Name: ${form.name}\n` +
      `Email: ${form.email}\n` +
      `Subject: ${form.subject}\n\n` +
      `${form.message}`;
    try {
      await navigator.clipboard.writeText(composed);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — proceed anyway.
    }
    window.open(MESSENGER_URL, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  return (
    <section className="relative py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12">
        <motion.div {...fadeUpView()} className="glass p-8 md:p-12">
          <div className="flex flex-col items-center text-center mb-8">
            <span className="inline-block text-sm mb-3 uppercase tracking-widest" style={{ color: "#8B9EFF", fontWeight: 600 }}>
              Send a Message
            </span>
            <h2 className="text-white mb-3" style={{ fontWeight: 700 }}>Drop Us a Line</h2>
            <p className="text-slate-400 max-w-md">
              Fill this out and we&apos;ll open Messenger with your message copied — just paste and send.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="cf-name" className="text-sm text-slate-300" style={{ fontWeight: 500 }}>Name</label>
                <input id="cf-name" name="name" type="text" required value={form.name} onChange={update("name")}
                  className="rounded-xl px-4 py-3.5 outline-none placeholder:text-slate-500" style={inputStyle} placeholder="Your name" />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="cf-email" className="text-sm text-slate-300" style={{ fontWeight: 500 }}>Email</label>
                <input id="cf-email" name="email" type="email" required value={form.email} onChange={update("email")}
                  className="rounded-xl px-4 py-3.5 outline-none placeholder:text-slate-500" style={inputStyle} placeholder="you@example.com" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="cf-subject" className="text-sm text-slate-300" style={{ fontWeight: 500 }}>Subject</label>
              <input id="cf-subject" name="subject" type="text" required value={form.subject} onChange={update("subject")}
                className="rounded-xl px-4 py-3.5 outline-none placeholder:text-slate-500" style={inputStyle} placeholder="What's this about?" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="cf-message" className="text-sm text-slate-300" style={{ fontWeight: 500 }}>Message</label>
              <textarea id="cf-message" name="message" required rows={5} value={form.message} onChange={update("message")}
                className="rounded-xl px-4 py-3.5 outline-none resize-y placeholder:text-slate-500" style={inputStyle} placeholder="Tell us how we can help…" />
            </div>

            <button type="submit"
              className="inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl transition-all hover:opacity-90 self-start"
              style={{ background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", fontWeight: 600, boxShadow: "0 8px 32px rgba(79,110,247,0.35)" }}>
              <Send className="w-4 h-4 shrink-0" /> Send via Messenger
            </button>

            {sent && (
              <p className="inline-flex items-center gap-2 text-sm" style={{ color: "#4ADE80" }}>
                <Check className="w-4 h-4 shrink-0" />
                Messenger opened and your message was copied — paste it into the chat to send.
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}

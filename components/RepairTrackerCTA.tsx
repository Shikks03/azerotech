"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { fadeUpView } from "@/lib/motion";

export default function RepairTrackerCTA() {
  const [value, setValue] = useState("");
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    router.push(v ? `/repair-status?ref=${encodeURIComponent(v)}` : "/repair-status");
  };

  return (
    <section className="py-16 md:py-24 relative">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12">
        <motion.div {...fadeUpView()} className="glass p-8 md:p-12 flex flex-col items-center text-center">
          <h2 className="text-white mb-3" style={{ fontWeight: 700 }}>Track Your Repair</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            Enter your repair order number or phone number to see your live repair status.
          </p>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
            <div className="flex items-center gap-3 flex-1 rounded-xl px-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Search className="w-5 h-5 shrink-0" style={{ color: "#8B9EFF" }} />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter Repair Order Number"
                aria-label="Repair order number or phone number"
                className="flex-1 bg-transparent py-4 text-white placeholder:text-slate-500 outline-none"
              />
            </div>
            <button type="submit"
              className="inline-flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", fontWeight: 600, boxShadow: "0 8px 32px rgba(79,110,247,0.35)" }}>
              Check Status
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

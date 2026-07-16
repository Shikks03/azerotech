import { fadeUpView } from "@/lib/motion";
import { motion } from "motion/react";

export default function SectionHeading({
  eyebrow, title, subtitle, className = "",
}: { eyebrow: string; title: string; subtitle?: string; className?: string }) {
  return (
    <motion.div {...fadeUpView()} className={`flex flex-col items-center text-center ${className}`}>
      <span className="inline-block text-sm mb-3 uppercase tracking-widest" style={{ color: "#8B9EFF", fontWeight: 600 }}>
        {eyebrow}
      </span>
      <h2 className="text-white mb-3" style={{ fontWeight: 700 }}>{title}</h2>
      {subtitle && <p className="text-slate-400 max-w-md">{subtitle}</p>}
    </motion.div>
  );
}

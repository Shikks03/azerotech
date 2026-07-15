import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ServiceTile({
  Icon, title, desc, href, color, label,
}: {
  Icon: React.ElementType; title: string; desc: string;
  href: string; color: string; label: string;
}) {
  return (
    <Link href={href} className="flex flex-col h-full w-full group">
      <div className="glass glass-hover flex flex-col flex-1 p-8 cursor-pointer">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110 shrink-0"
          style={{ background: "rgba(79,110,247,0.15)" }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
        <h3 className="text-white mb-4" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-8">{desc}</p>
        <span className="inline-flex items-center gap-2 text-sm transition-all group-hover:gap-3" style={{ color, fontWeight: 600 }}>
          {label} <ArrowRight className="w-4 h-4 shrink-0" />
        </span>
      </div>
    </Link>
  );
}

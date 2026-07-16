import { Star } from "lucide-react";

export default function ReviewCard({
  quote, name, meta, rating = 5,
}: { quote: string; name: string; meta: string; rating?: number }) {
  return (
    <div className="glass flex flex-col flex-1 p-8">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4" style={{ color: "#FBBF24", fill: "#FBBF24" }} />
        ))}
      </div>
      <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="text-white text-sm" style={{ fontWeight: 600 }}>{name}</p>
        <p className="text-slate-500 text-xs">{meta}</p>
      </div>
    </div>
  );
}

export default function FeatureTile({
  Icon, title, desc,
}: { Icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="glass glass-hover flex flex-col flex-1 p-10 group">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-8 transition-colors duration-300 shrink-0"
        style={{ background: "rgba(79,110,247,0.15)" }}
      >
        <Icon className="w-6 h-6" style={{ color: "#8B9EFF" }} />
      </div>
      <h4 className="text-white mb-4" style={{ fontWeight: 600, fontSize: "1rem" }}>{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

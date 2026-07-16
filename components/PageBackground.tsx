export default function PageBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, #080B1A 0%, #0F1535 55%, #080B1A 100%)" }}
      />
      {/* Faint grid */}
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
        className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #4F6EF7, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[26rem] h-[26rem] rounded-full opacity-[0.08]"
        style={{ background: "radial-gradient(circle, #06B6D4, transparent 70%)" }}
      />
      {/*
        DEFERRED (V1-b): floating 3D shape PNGs go here once assets are supplied.
        Render each as <img className="absolute animate-float" .../> positioned
        absolutely; keep pointer-events-none. No layout rework needed to add them.
      */}
    </div>
  );
}

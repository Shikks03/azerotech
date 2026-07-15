"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Search, CheckCircle2, Clock, Wrench, PackageCheck } from "lucide-react";
import { ease } from "@/lib/motion";

const STAGES = [
  { key: "Device Received",   label: "Received",     Icon: PackageCheck },
  { key: "Waiting for Parts", label: "Parts",         Icon: Clock },
  { key: "Fixing",            label: "Fixing",        Icon: Wrench },
  { key: "Ready for Pickup",  label: "Ready",         Icon: CheckCircle2 },
];

interface RepairResult {
  appointmentId: string;
  service: string;
  brand: string;
  deviceType: string;
  date: string;
  status: string;
  repairStage: string | null;
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function StageTracker({ currentStage }: { currentStage: string | null }) {
  const currentIdx = currentStage ? STAGES.findIndex((s) => s.key === currentStage) : -1;

  return (
    <div className="flex items-start gap-0 mt-6">
      {STAGES.map((stage, idx) => {
        const done = idx <= currentIdx;
        const { Icon } = stage;
        return (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all"
                style={{
                  background: done ? "linear-gradient(135deg, #4F6EF7, #6B84FF)" : "rgba(255,255,255,0.08)",
                  boxShadow: done ? "0 4px 12px rgba(79,110,247,0.35)" : "none",
                }}
              >
                <Icon className="w-4 h-4" style={{ color: done ? "white" : "#475569" }} />
              </div>
              <span
                className="text-xs font-semibold text-center leading-tight"
                style={{ color: done ? "#8B9EFF" : "#475569" }}
              >
                {stage.label}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className="h-0.5 flex-1 -mt-5 mx-1 transition-all"
                style={{ background: idx < currentIdx ? "#4F6EF7" : "rgba(255,255,255,0.1)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RepairStatusInner() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent, override?: string) => {
    e.preventDefault();
    const trimmed = (override ?? query).trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const param = /^09\d{9}$/.test(trimmed)
        ? `phone=${encodeURIComponent(trimmed)}`
        : `appointmentId=${encodeURIComponent(trimmed)}`;

      const res = await fetch(`/api/repair-status?${param}`);

      if (res.status === 404) {
        setError("No active repair found. Check your Appointment ID or phone number.");
      } else if (!res.ok) {
        setError("Something went wrong. Please try again.");
      } else {
        setResult(await res.json());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setQuery(ref);
      handleSearch({ preventDefault: () => {} } as React.FormEvent, ref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-6 py-24"
      style={{ background: "linear-gradient(135deg, #080B1A 0%, #0F1535 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <span
            className="inline-flex items-center gap-2 border rounded-full px-5 py-2.5 text-sm mb-5"
            style={{
              background: "rgba(79,110,247,0.15)",
              borderColor: "rgba(79,110,247,0.3)",
              color: "#8B9EFF",
              fontWeight: 500,
            }}
          >
            <Search className="w-3.5 h-3.5" />
            Repair Tracker
          </span>
          <h1 className="text-3xl font-bold text-white mb-3">Track Your Repair</h1>
          <p className="text-slate-400 text-sm">
            Enter your Appointment ID or phone number to check the status of your device.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="AZT-260326-AB1C2D  or  09XXXXXXXXX"
            disabled={loading}
            className="flex-1 px-4 py-3.5 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600 transition-opacity"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              opacity: loading ? 0.6 : 1,
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(79,110,247,0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", boxShadow: "0 6px 20px rgba(79,110,247,0.3)" }}
          >
            {loading ? "…" : "Check"}
          </button>
        </form>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease }}
            className="rounded-xl px-5 py-4 text-sm font-medium mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}
          >
            {error}
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(79,110,247,0.2)" }}
          >
            {/* Appointment summary */}
            <div className="mb-1">
              <span
                className="text-xs font-mono tracking-widest font-bold"
                style={{ color: "#4F6EF7" }}
              >
                {result.appointmentId}
              </span>
            </div>
            <div className="text-white font-bold text-lg mb-1">
              {result.service} — {result.brand} {result.deviceType}
            </div>
            <div className="text-slate-400 text-sm mb-6">{formatDate(result.date)}</div>

            {/* Stage display */}
            {result.repairStage ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Current Stage</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(79,110,247,0.2)", color: "#8B9EFF" }}
                  >
                    {result.repairStage}
                  </span>
                </div>
                <StageTracker currentStage={result.repairStage} />
              </>
            ) : (
              <div
                className="rounded-xl px-5 py-4 text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
              >
                Your device has been received. We&apos;ll update the repair stage shortly.
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function RepairStatusPage() {
  return (
    <Suspense fallback={null}>
      <RepairStatusInner />
    </Suspense>
  );
}

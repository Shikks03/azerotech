"use client";

import { useState, useEffect } from "react";

type EntryStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

interface AppointmentEntry {
  id: string;
  appointmentId?: string;
  type: "appointment";
  submittedAt: string;
  status: EntryStatus;
  service: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  brand: string;
  deviceType: string;
  problem?: string;
}
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  CheckCircle2,
  MessageCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ease, fadeUp, fadeUpView } from "@/lib/motion";

const services = [
  {
    id: "phone",
    label: "Phone Repair",
    desc: "LCD, charging, buttons, reformat & more",
    color: "#4F6EF7",
    bg: "#EEF1FF",
  },
  {
    id: "laptop",
    label: "Laptop / Desktop Repair",
    desc: "OS reformat, hardware maintenance & tuning",
    color: "#06B6D4",
    bg: "#EEF1FF",
  },
  {
    id: "checkup",
    label: "Device Checkup",
    desc: "General diagnostics and assessment",
    color: "#8B5CF6",
    bg: "#EEF1FF",
  },
];

const timeSlots = [
  "9:00 AM",  "9:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "1:00 PM",  "1:30 PM",
  "2:00 PM",  "2:30 PM",
  "3:00 PM",  "3:30 PM",
  "4:00 PM",  "4:30 PM",
  "5:00 PM",  "5:30 PM",
];

const steps = [
  { n: 1, label: "Service",    Icon: CheckCircle2 },
  { n: 2, label: "Date & Time", Icon: CalendarDays },
  { n: 3, label: "Your Info",  Icon: User },
  { n: 4, label: "Confirm",    Icon: CheckCircle2 },
];

const isPhoneValid = (v: string) => /^09\d{9}$/.test(v);

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    service: "",
    date: "",
    time: "",
    firstName: "",
    lastName: "",
    phone: "",
    brand: "",
    deviceType: "",
    problem: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setFormData((prev) => ({ ...prev, phone: digits }));
      if (digits.length > 0 && !digits.startsWith("09")) {
        setPhoneError("Phone number must start with 09.");
      } else if (digits.length > 0 && digits.length < 11) {
        setPhoneError("Phone number must be exactly 11 digits.");
      } else {
        setPhoneError("");
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split("T")[0];
  };

  const handleDateSelect = (isoDate: string) => {
    setFormData((p) => ({ ...p, date: isoDate, time: "" }));
    setBookedSlots([]);
    setSlotsLoading(true);
    fetch(`/api/appointments/booked-slots?date=${isoDate}`)
      .then((r) => r.json())
      .then(({ bookedTimes }) => setBookedSlots(bookedTimes ?? []))
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  };

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const getCalendarDays = () => {
    const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
    const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const canGoPrevMonth = () => {
    const today = new Date();
    return (
      calMonth.year > today.getFullYear() ||
      (calMonth.year === today.getFullYear() && calMonth.month > today.getMonth())
    );
  };

  const canGoNextMonth = () => {
    const nextM = calMonth.month === 11 ? 0 : calMonth.month + 1;
    const nextY = calMonth.month === 11 ? calMonth.year + 1 : calMonth.year;
    const firstOfNext = new Date(nextY, nextM, 1);
    const maxD = new Date(`${getMaxDate()}T00:00:00`);
    return firstOfNext <= maxD;
  };

  const prevMonth = () => {
    if (!canGoPrevMonth()) return;
    setCalMonth((c) =>
      c.month === 0 ? { month: 11, year: c.year - 1 } : { month: c.month - 1, year: c.year }
    );
  };

  const nextMonth = () => {
    if (!canGoNextMonth()) return;
    setCalMonth((c) =>
      c.month === 11 ? { month: 0, year: c.year + 1 } : { month: c.month + 1, year: c.year }
    );
  };

  const canProceed = () => {
    if (step === 1) return !!formData.service;
    if (step === 2) return !!formData.date && !!formData.time;
    if (step === 3)
      return (
        !!formData.firstName &&
        !!formData.lastName &&
        isPhoneValid(formData.phone) &&
        !!formData.brand &&
        !!formData.deviceType
      );
    return true;
  };

  useEffect(() => {
    if (confirmed) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [confirmed]);

  const handleNext = () => { if (step < 4) setStep(step + 1); };
  const handlePrev = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const newEntry: AppointmentEntry = {
      id: crypto.randomUUID(),
      type: "appointment",
      submittedAt: new Date().toISOString(),
      status: "Pending",
      service: formData.service,
      date: formData.date,
      time: formData.time,
      name: `${formData.firstName} ${formData.lastName}`,
      phone: formData.phone,
      brand: formData.brand,
      deviceType: formData.deviceType,
      ...(formData.problem ? { problem: formData.problem } : {}),
    };
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      let data: { appointmentId?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* empty body */ }
      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setConfirmedId(data.appointmentId ?? "");
      setSubmitting(false);
      setConfirmed(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    iso
      ? new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  /* ─── SUCCESS SCREEN ─── */
  if (confirmed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 py-24"
        style={{ background: "transparent" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease }}
          className="w-full max-w-lg rounded-2xl p-10 text-center"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(22,163,74,0.15)" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "#4ADE80" }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Appointment Confirmed!</h1>
          <p className="text-slate-400 mb-5 text-sm">
            Please arrive at your selected time. Need to reschedule? Message us on Messenger.
          </p>

          {confirmedId && (
            <div
              className="inline-flex items-center gap-2.5 rounded-xl px-5 py-3 mb-8 font-mono font-bold text-sm tracking-widest"
              style={{
                background: "rgba(79,110,247,0.1)",
                border: "1px solid rgba(79,110,247,0.25)",
                color: "#4F6EF7",
              }}
            >
              <span className="text-slate-400 font-semibold font-sans tracking-normal text-xs">
                Appointment ID
              </span>
              {confirmedId}
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(confirmedId)}
                title="Copy to clipboard"
                className="ml-0.5 p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div
            className="rounded-xl p-6 text-left mb-8 space-y-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {[
              ["Service",    formData.service],
              ["Date",       formatDate(formData.date)],
              ["Time",       formData.time],
              ["Name",       `${formData.firstName} ${formData.lastName}`],
              ["Phone",      formData.phone],
              ["Device",     `${formData.brand} ${formData.deviceType}`],
              ...(formData.problem ? [["Problem", formData.problem] as [string, string]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 text-sm" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-slate-400 font-medium shrink-0 pb-2">{k}</span>
                <span className="text-white font-semibold text-right pb-2">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 text-white py-3.5 rounded-xl font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", boxShadow: "0 6px 20px rgba(79,110,247,0.3)" }}
            >
              Back to Home
            </Link>
            <Link
              href="/accessories"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all text-slate-300"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Browse Accessories
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── MAIN PAGE ─── */
  return (
    <div className="flex flex-col">

      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden flex flex-col justify-center"
        style={{
          background: "transparent",
          minHeight: "50vh",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 py-24 max-w-4xl mx-auto w-full">
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
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              4 Easy Steps
            </span>
          </motion.div>
          <motion.h1
            {...fadeUp(0.08)}
            className="text-white mb-6"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)", fontWeight: 700, lineHeight: 1.1 }}
          >
            Book an{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Appointment
            </span>
          </motion.h1>
          <motion.p
            {...fadeUp(0.16)}
            className="text-slate-400 max-w-md leading-relaxed"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.1rem)" }}
          >
            Schedule your device repair or checkup in just a few steps.
          </motion.p>
        </div>
      </section>

      {/* ─── FORM ─── */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-6 sm:px-10">

          {/* Stepper */}
          <motion.div {...fadeUpView()} className="mb-12">
            <div className="flex items-center justify-between gap-2 mb-5">
              {steps.map((s, idx) => (
                <div key={s.n} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                      style={
                        step >= s.n
                          ? { background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", color: "white", boxShadow: "0 4px 12px rgba(79,110,247,0.35)" }
                          : { background: "rgba(255,255,255,0.12)", color: "#94A3B8" }
                      }
                    >
                      {s.n}
                    </div>
                    <p
                      className="text-xs font-semibold mt-2 text-center"
                      style={{ color: step >= s.n ? "#4F6EF7" : "#94A3B8" }}
                    >
                      {s.label}
                    </p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-300"
                      style={{ background: step > s.n ? "#4F6EF7" : "rgba(255,255,255,0.12)" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card */}
          <motion.div
            {...fadeUpView(0.08)}
            className="rounded-2xl p-8 md:p-10"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
            }}
          >
            <form onSubmit={handleSubmit}>

              {/* ── Step 1: Service ── */}
              {step === 1 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#4F6EF7" }}>Step 1 of 4</p>
                  <h2 className="text-white text-2xl font-bold mb-6">Select a Service</h2>
                  <div className="flex flex-col gap-4">
                    {services.map((svc) => {
                      const selected = formData.service === svc.label;
                      return (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, service: svc.label }))}
                          className="flex items-center gap-5 text-left rounded-xl px-6 py-5 border-2 transition-all duration-200"
                          style={
                            selected
                              ? { borderColor: svc.color, background: `${svc.color}18` }
                              : { borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }
                          }
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: selected ? `${svc.color}22` : "rgba(255,255,255,0.08)" }}
                          >
                            <CheckCircle2
                              className="w-5 h-5"
                              style={{ color: selected ? svc.color : "#CBD5E1" }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white">{svc.label}</p>
                            <p className="text-slate-400 text-sm">{svc.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 2: Date & Time ── */}
              {step === 2 && (
                <div className="space-y-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#4F6EF7" }}>Step 2 of 4</p>
                    <h2 className="text-white text-2xl font-bold">Choose Date & Time</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      <CalendarDays className="inline w-4 h-4 mr-1.5 mb-0.5" style={{ color: "#4F6EF7" }} />
                      Select Date
                    </label>

                    {/* Calendar */}
                    <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>

                      {/* Month header */}
                      <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <button
                          type="button"
                          onClick={prevMonth}
                          disabled={!canGoPrevMonth()}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-white text-sm">
                          {monthNames[calMonth.month]} {calMonth.year}
                        </span>
                        <button
                          type="button"
                          onClick={nextMonth}
                          disabled={!canGoNextMonth()}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Day-of-week headers */}
                      <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Day cells */}
                      <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
                        {getCalendarDays().map((day, i) => {
                          if (day === null) return <div key={`e-${i}`} />;
                          const mm = String(calMonth.month + 1).padStart(2, "0");
                          const dd = String(day).padStart(2, "0");
                          const isoDate = `${calMonth.year}-${mm}-${dd}`;
                          const date = new Date(`${isoDate}T00:00:00`);
                          const minD = new Date(`${getMinDate()}T00:00:00`);
                          const maxD = new Date(`${getMaxDate()}T00:00:00`);
                          const disabled = date < minD || date > maxD;
                          const selected = formData.date === isoDate;
                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={disabled}
                              onClick={() => handleDateSelect(isoDate)}
                              className="aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-all duration-150 hover:bg-white/10"
                              style={
                                selected
                                  ? {
                                      background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                                      color: "white",
                                      boxShadow: "0 4px 12px rgba(79,110,247,0.35)",
                                    }
                                  : disabled
                                  ? { color: "#D1D5DB", cursor: "not-allowed", opacity: 0.3 }
                                  : { color: "#E2E8F0" }
                              }
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {formData.date ? (
                      <p className="text-xs mt-2 font-medium" style={{ color: "#4F6EF7" }}>
                        Selected: {formatDate(formData.date)}
                      </p>
                    ) : (
                      <p className="text-xs mt-2 text-slate-400">
                        Pick a date — up to 2 months from today
                      </p>
                    )}
                  </div>

                  {formData.date && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <Clock className="inline w-4 h-4" style={{ color: "#4F6EF7" }} />
                        Select Time Slot
                        {slotsLoading && (
                          <span className="text-xs font-normal text-slate-400">Loading availability…</span>
                        )}
                      </label>
                      <div className={`grid grid-cols-3 sm:grid-cols-4 gap-3 transition-opacity ${slotsLoading ? "opacity-50 pointer-events-none" : ""}`}>
                        {timeSlots.map((slot) => {
                          const selected = formData.time === slot;
                          const booked = bookedSlots.includes(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={booked}
                              onClick={() => setFormData((p) => ({ ...p, time: slot }))}
                              className="py-2.5 rounded-xl text-sm font-semibold text-center transition-all duration-200 border-2"
                              style={
                                booked
                                  ? { background: "rgba(255,255,255,0.03)", color: "#475569", borderColor: "rgba(255,255,255,0.06)", cursor: "not-allowed", opacity: 0.5 }
                                  : selected
                                  ? { background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", color: "white", borderColor: "transparent", boxShadow: "0 4px 12px rgba(79,110,247,0.3)" }
                                  : { background: "rgba(255,255,255,0.06)", color: "#CBD5E1", borderColor: "rgba(255,255,255,0.12)" }
                              }
                            >
                              <span className="block leading-tight">{slot}</span>
                              {booked && <span className="block text-xs font-medium mt-0.5" style={{ color: "#475569" }}>Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Your Info ── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#4F6EF7" }}>Step 3 of 4</p>
                    <h2 className="text-white text-2xl font-bold">Your Information</h2>
                  </div>

                  {/* First Name + Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        First Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                        className="w-full px-4 py-3 rounded-xl focus:outline-none placeholder:text-slate-500"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#E2E8F0" }}
                        onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Last Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        className="w-full px-4 py-3 rounded-xl focus:outline-none placeholder:text-slate-500"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#E2E8F0" }}
                        onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                      Phone Number <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="09XXXXXXXXX"
                      maxLength={11}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none placeholder:text-slate-500 transition-colors"
                      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${phoneError ? "#EF4444" : "rgba(255,255,255,0.12)"}`, color: "#E2E8F0" }}
                      onFocus={(e) => { if (!phoneError) e.target.style.borderColor = "#4F6EF7"; }}
                      onBlur={(e) => { if (!phoneError) e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
                    />
                    {phoneError && (
                      <p className="text-sm mt-1.5 font-medium" style={{ color: "#EF4444" }}>
                        {phoneError}
                      </p>
                    )}
                    {!phoneError && formData.phone.length > 0 && (
                      <p className="text-xs mt-1.5 text-slate-400">
                        {formData.phone.length} / 11 digits
                      </p>
                    )}
                  </div>

                  {/* Brand + Device Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Device Brand <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        placeholder="e.g., Samsung"
                        className="w-full px-4 py-3 rounded-xl focus:outline-none placeholder:text-slate-500"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#E2E8F0" }}
                        onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Device Type <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <select
                        name="deviceType"
                        value={formData.deviceType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#E2E8F0" }}
                        onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                      >
                        <option value="" style={{ background: "#0F1535" }}>Select type</option>
                        <option value="Phone" style={{ background: "#0F1535" }}>Phone</option>
                        <option value="Laptop" style={{ background: "#0F1535" }}>Laptop</option>
                        <option value="Desktop" style={{ background: "#0F1535" }}>Desktop</option>
                      </select>
                    </div>
                  </div>

                  {/* Problem (optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                      Problem Description <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      name="problem"
                      value={formData.problem}
                      onChange={handleInputChange}
                      placeholder="Describe the issue with your device"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none placeholder:text-slate-500 resize-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#E2E8F0" }}
                      onFocus={(e) => (e.target.style.borderColor = "#4F6EF7")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 4: Review ── */}
              {step === 4 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#4F6EF7" }}>Step 4 of 4</p>
                  <h2 className="text-white text-2xl font-bold mb-6">Review & Confirm</h2>

                  <div
                    className="rounded-xl overflow-hidden mb-8"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {[
                      ["Service",    formData.service],
                      ["Date",       formatDate(formData.date)],
                      ["Time",       formData.time],
                      ["Name",       `${formData.firstName} ${formData.lastName}`],
                      ["Phone",      formData.phone],
                      ["Device",     `${formData.brand} ${formData.deviceType}`],
                      ...(formData.problem ? [["Problem", formData.problem] as [string, string]] : []),
                    ].map(([k, v], idx, arr) => (
                      <div
                        key={k}
                        className="flex justify-between gap-4 px-6 py-4 text-sm"
                        style={{
                          background: idx % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                          borderBottom: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                        }}
                      >
                        <span className="text-slate-400 font-medium shrink-0">{k}</span>
                        <span className="text-white font-semibold text-right">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-slate-300 hover:bg-white/10"
                      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" /> Go Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2.5 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                        boxShadow: "0 8px 24px rgba(79,110,247,0.35)",
                      }}
                    >
                      {submitting ? "Submitting…" : <>Confirm Appointment <ArrowRight className="w-5 h-5 shrink-0" /></>}
                    </button>
                  </div>
                  {submitError && (
                    <p className="text-red-400 text-sm text-center mt-3">{submitError}</p>
                  )}
                </div>
              )}

              {/* Navigation */}
              {step < 4 && (
                <div className="flex gap-3 mt-8">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all text-slate-300 hover:bg-white/10"
                      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" /> Previous
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex-1 flex items-center justify-center gap-2 text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                      boxShadow: canProceed() ? "0 6px 20px rgba(79,110,247,0.3)" : "none",
                    }}
                  >
                    Next <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              )}

            </form>
          </motion.div>
        </div>
      </section>

      {/* ─── NEED HELP ─── */}
      <section className="py-16 md:py-24" style={{ background: "transparent" }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-10">
          <motion.div {...fadeUpView()} className="flex flex-col items-center text-center mb-10">
            <span className="inline-block text-sm mb-4 uppercase tracking-widest font-semibold" style={{ color: "#8B9EFF" }}>
              Need Help?
            </span>
            <h2 className="text-white font-bold">Reach Out Directly</h2>
          </motion.div>

          <div className="flex justify-center">
            {[
              {
                Icon: MessageCircle,
                label: "Messenger",
                detail: "Chat on Messenger",
                href: "https://m.me/azerotech",
                accentBg: "rgba(0,132,255,0.15)",
                accentColor: "#60A5FA",
              },
            ].map((item, idx) => (
              <motion.a
                key={item.label}
                {...fadeUpView(idx * 0.08)}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center gap-5 rounded-2xl px-6 py-5 w-full max-w-sm transition-all duration-300 group"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: item.accentBg }}
                >
                  <item.Icon className="w-5 h-5" style={{ color: item.accentColor }} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="font-bold" style={{ color: item.accentColor }}>{item.detail}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

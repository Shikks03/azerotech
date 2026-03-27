"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  LogOut,
  CalendarDays,
  Clock,
  User,
  Phone,
  Wrench,
  ShoppingBag,
  ClipboardList,
  RefreshCw,
  Package,
  Plus,
  Minus,
  Pencil,
  Trash2,
  X,
  ArrowUpDown,
  Monitor,
  Search,
  Users,
  AlertTriangle,
  FileText,
  ChevronDown,
} from "lucide-react";

const TIME_SLOTS = [
  "9:00 AM",  "9:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "1:00 PM",  "1:30 PM",
  "2:00 PM",  "2:30 PM",
  "3:00 PM",  "3:30 PM",
  "4:00 PM",  "4:30 PM",
  "5:00 PM",  "5:30 PM",
];

function parseTimeToMinutes(t: string): number {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

type EntryStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

interface AppointmentEntry {
  id: string;
  appointmentId?: string;
  customerId?: string;
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
  repairStage?: string | null;
}

interface ReservationEntry {
  id: string;
  customerId?: string;
  type: "reservation";
  submittedAt: string;
  status: EntryStatus;
  name: string;
  phone: string;
  pickupDate: string;
  pickupTime: string;
  productName: string;
  productPrice: number;
}

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  stock?: number;
}

interface CustomerEntry {
  id: string;
  name: string;
  phone: string;
  type: "walk-in" | "appointment" | "reservation";
  nameMismatches: { submittedName: string; date: string }[];
  createdAt: string;
  // populated client-side
  appointments?: AppointmentEntry[];
  reservations?: ReservationEntry[];
  serviceRecords?: ServiceRecord[];
}

interface ServiceRecord {
  id: string;
  customerId: string;
  date: string;
  service: string;
  device: string;
  cost: number;
  notes: string;
  createdAt: string;
}

interface LcdItem {
  id: number;
  name: string;
  stock: number;
}

const STATUS_STYLES: Record<EntryStatus, { bg: string; color: string }> = {
  Pending:   { bg: "rgba(234,179,8,0.15)",   color: "#EAB308" },
  Confirmed: { bg: "rgba(79,110,247,0.15)",  color: "#4F6EF7" },
  Completed: { bg: "rgba(22,163,74,0.15)",   color: "#16A34A" },
  Cancelled: { bg: "rgba(239,68,68,0.15)",   color: "#EF4444" },
};

const STATUSES: EntryStatus[] = ["Pending", "Confirmed", "Completed", "Cancelled"];

function stockLevel(stock: number | undefined): { color: string; bg: string; label: string } {
  if (stock === undefined) return { color: "#94A3B8", bg: "rgba(148,163,184,0.15)", label: "—" };
  if (stock === 0)  return { color: "#EF4444", bg: "rgba(239,68,68,0.15)",  label: "Out of Stock" };
  if (stock <= 5)   return { color: "#EAB308", bg: "rgba(234,179,8,0.15)",  label: "Low Stock" };
  return              { color: "#16A34A", bg: "rgba(22,163,74,0.15)",  label: "In Stock" };
}

function lcdStockLevel(stock: number): { color: string; bg: string; label: string } {
  if (stock === 0) return { color: "#EF4444", bg: "rgba(239,68,68,0.15)",  label: "No Stock" };
  if (stock === 1) return { color: "#EAB308", bg: "rgba(234,179,8,0.15)",  label: "Low Stock" };
  return             { color: "#16A34A", bg: "rgba(22,163,74,0.15)",  label: "In Stock" };
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSubmittedAt(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSubmittedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminPage() {
  const lastActiveRef = useRef<number>(Date.now());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<{ count: number; max: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"appointments" | "reservations" | "inventory" | "lcd-stock" | "customers">("appointments");
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [reservations, setReservations] = useState<ReservationEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [apptSearch, setApptSearch] = useState("");
  const [apptSort, setApptSort] = useState<"date-asc" | "date-desc" | "name" | "Pending" | "Confirmed" | "Completed" | "Cancelled">("date-asc");
  const [resSort, setResSort] = useState<"date-asc" | "date-desc" | "name" | "Pending" | "Confirmed" | "Completed" | "Cancelled">("date-asc");
  const [resSearch, setResSearch] = useState("");
  const [editingRes, setEditingRes] = useState<ReservationEntry | null>(null);
  const [editingAppt, setEditingAppt] = useState<AppointmentEntry | null>(null);
  // per-product manual stock input values
  const [stockInputs, setStockInputs] = useState<Record<number, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<CustomerEntry[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [custSort, setCustSort] = useState<"latest" | "oldest" | "name" | "visits">("latest");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerEntry | null>(null);
  const [addingRecordFor, setAddingRecordFor] = useState<CustomerEntry | null>(null);
  const [confirmDeleteCustomerId, setConfirmDeleteCustomerId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const toggleHistory = (id: string) =>
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const [lcdSearch, setLcdSearch] = useState("");
  const [lcdSort, setLcdSort] = useState<"name-asc" | "name-desc" | "low-stock" | "no-stock">("name-asc");

  // LCD Stock state (cloud-backed)
  const [lcdItems, setLcdItems] = useState<LcdItem[]>([]);
  const [lcdStockInputs, setLcdStockInputs] = useState<Record<number, string>>({});
  const [showAddLcdModal, setShowAddLcdModal] = useState(false);
  const [editingLcd, setEditingLcd] = useState<LcdItem | null>(null);
  const [confirmDeleteLcdId, setConfirmDeleteLcdId] = useState<number | null>(null);

  const adminFetch = async (
    input: string,
    init?: RequestInit
  ): Promise<Response | null> => {
    const method = (init?.method ?? "GET").toUpperCase();
    const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(method);

    const res = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (res.status === 401) {
      sessionStorage.removeItem("azerotech_admin_authed");
      setIsAuthenticated(false);
      return null;
    }

    return res;
  };

  useEffect(() => {
    const authed = sessionStorage.getItem("azerotech_admin_authed") === "true";
    if (!authed) return;
    // M5: Verify the httpOnly cookie is still valid before granting UI access
    setLoading(true);
    fetch("/api/admin/ping", { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then((res) => {
        if (res.status === 401) {
          sessionStorage.removeItem("azerotech_admin_authed");
          setLoading(false);
        } else {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        sessionStorage.removeItem("azerotech_admin_authed");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const CHECK_INTERVAL_MS = 5 * 60 * 1000; // check every 5 min — must be shorter than IDLE_TIMEOUT_MS so idle users are caught promptly
    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // expire session after 30 min idle
    const timer = setInterval(async () => {
      const idleMs = Date.now() - lastActiveRef.current;
      if (idleMs >= IDLE_TIMEOUT_MS) {
        // Idle for 30+ minutes — expire the session
        sessionStorage.removeItem("azerotech_admin_authed");
        setIsAuthenticated(false);
        return;
      }
      const res = await fetch("/api/admin/refresh", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("azerotech_admin_authed");
        setIsAuthenticated(false);
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    const updateActivity = () => { lastActiveRef.current = Date.now(); };
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const xrwHeaders = { headers: { "X-Requested-With": "XMLHttpRequest" } };
    Promise.all([
      fetch("/api/appointments", xrwHeaders),
      fetch("/api/reservations", xrwHeaders),
      fetch("/api/products", xrwHeaders),
      fetch("/api/customers", xrwHeaders),
      fetch("/api/lcd-stock", xrwHeaders),
    ]).then(async (responses) => {
      if (responses.some((r) => r.status === 401)) {
        sessionStorage.removeItem("azerotech_admin_authed");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      const [appts, resrvs, prods, custs, lcds] = await Promise.all(
        responses.map((r) => r.json())
      );
      const apptList = appts as AppointmentEntry[];
      const resvList = resrvs as ReservationEntry[];
      setAppointments(apptList);
      setReservations(resvList);
      setProducts(prods as Product[]);
      setLcdItems(lcds as LcdItem[]);

      // Fetch service records for all customers
      const custList = custs as (Omit<CustomerEntry, "id"> & { _id: string })[];
      const withRecords = await Promise.all(
        custList.map(async (c) => {
          const cid = c._id.toString();
          let serviceRecords: ServiceRecord[] = [];
          try {
            const res = await adminFetch(`/api/customers/${cid}/records`);
            if (res) {
              const raw = (await res.json()) as (Omit<ServiceRecord, "id"> & { _id: string })[];
              serviceRecords = raw.map((r) => ({ ...r, id: r._id.toString() }));
            }
          } catch {}
          const cAppts = apptList.filter((a) => a.customerId === cid);
          const cResvs = resvList.filter((r) => r.customerId === cid);
          return {
            ...c,
            id: cid,
            appointments: cAppts,
            reservations: cResvs,
            serviceRecords,
          } as CustomerEntry;
        })
      );
      setCustomers(withRecords);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, refreshKey]);

  const loadData = () => setRefreshKey((k) => k + 1);

  const updateLcdStock = async (id: number, newStock: number) => {
    if (newStock < 0) return;
    setLcdItems((prev) => prev.map((item) => item.id === id ? { ...item, stock: newStock } : item));
    await adminFetch(`/api/lcd-stock/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: newStock }),
    });
  };

  const addLcdItem = async (name: string, stock: number) => {
    const res = await adminFetch("/api/lcd-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stock }),
    });
    if (!res) return;
    const newItem = await res.json() as LcdItem;
    setLcdItems((prev) => [...prev, newItem]);
    setShowAddLcdModal(false);
  };

  const editLcdName = async (id: number, name: string) => {
    setLcdItems((prev) => prev.map((item) => item.id === id ? { ...item, name: name.trim() } : item));
    await adminFetch(`/api/lcd-stock/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setEditingLcd(null);
  };

  const deleteLcdItem = async (id: number) => {
    setLcdItems((prev) => prev.filter((item) => item.id !== id));
    await adminFetch(`/api/lcd-stock/${id}`, { method: "DELETE" });
    setConfirmDeleteLcdId(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (res.ok) {
        sessionStorage.setItem("azerotech_admin_authed", "true");
        setLoading(true);
        setIsAuthenticated(true);
        setLoginError(false);
        setLoginAttempts(null);
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    sessionStorage.removeItem("azerotech_admin_authed");
    setIsAuthenticated(false);
    setPasswordInput("");
    setLoginError(false);
  };

  const updateAppointmentStatus = (id: string, status: EntryStatus) => {
    setAppointments((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    adminFetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const updateReservationFull = async (id: string, data: Partial<ReservationEntry>) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    setEditingRes(null);
    await adminFetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const updateAppointmentFull = async (id: string, data: Partial<AppointmentEntry>) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    setEditingAppt(null);
    await adminFetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    adminFetch(`/api/appointments/${id}`, { method: "DELETE" });
  };

  const deleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    adminFetch(`/api/reservations/${id}`, { method: "DELETE" });
  };

  const addCustomer = async (name: string, phone: string) => {
    const res = await adminFetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, type: "walk-in" }),
    });
    if (!res) return;
    if (res.ok) {
      setAddingCustomer(false);
      loadData();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to add customer");
    }
  };

  const editCustomer = async (id: string, data: { name?: string; phone?: string }) => {
    await adminFetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingCustomer(null);
    loadData();
  };

  const dismissMismatches = async (id: string) => {
    await adminFetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissMismatches: true }),
    });
    loadData();
  };

  const deleteCustomer = async (id: string) => {
    await adminFetch(`/api/customers/${id}`, { method: "DELETE" });
    setConfirmDeleteCustomerId(null);
    loadData();
  };

  const addServiceRecord = async (
    customerId: string,
    data: { date: string; service: string; device: string; cost: number; notes: string }
  ) => {
    await adminFetch(`/api/customers/${customerId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setAddingRecordFor(null);
    loadData();
  };

  const deleteServiceRecord = async (customerId: string, recordId: string) => {
    await adminFetch(`/api/customers/${customerId}/records/${recordId}`, { method: "DELETE" });
    loadData();
  };

  const updateReservationStatus = (id: string, status: EntryStatus) => {
    const reservation = reservations.find((r) => r.id === id);
    setReservations((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    adminFetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (reservation && reservation.status !== status) {
      if (status === "Completed") {
        setProducts((prev) =>
          prev.map((p) =>
            p.name === reservation.productName
              ? { ...p, stock: Math.max(0, (p.stock ?? 0) - 1) }
              : p
          )
        );
      } else if (reservation.status === "Completed") {
        setProducts((prev) =>
          prev.map((p) =>
            p.name === reservation.productName
              ? { ...p, stock: (p.stock ?? 0) + 1 }
              : p
          )
        );
      }
    }
  };

  const updateStock = (productId: number, newStock: number) => {
    if (newStock < 0) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    adminFetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: newStock }),
    });
  };

  const addProduct = async (data: { name: string; price: string; category: string; image: string; stock: number }) => {
    await adminFetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddModal(false);
    loadData();
  };

  const editProductInfo = async (id: number, data: { name: string; price: string; category: string; image: string }) => {
    await adminFetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingProduct(null);
    loadData();
  };

  const deleteProduct = async (id: number) => {
    await adminFetch(`/api/products/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    loadData();
  };

  const pendingCount =
    appointments.filter((a) => a.status === "Pending").length +
    reservations.filter((r) => r.status === "Pending").length;

  const outOfStockCount = products.filter((p) => p.stock === 0).length;


  /* ─── LOGIN SCREEN ─── */
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "#080B1A" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="w-full max-w-sm bg-white rounded-2xl p-10"
          style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
        >
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "rgba(79,110,247,0.12)" }}
            >
              <Lock className="w-7 h-7" style={{ color: "#4F6EF7" }} />
            </div>
            <h1 className="text-[#0F172A] text-2xl font-bold">Admin Access</h1>
            <p className="text-slate-400 text-sm mt-1">AzeroTech Internal Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setLoginError(false);
                }}
                placeholder="Enter admin password"
                autoFocus
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-[#0F172A] placeholder:text-slate-400 transition-colors"
                style={{ borderColor: loginError ? "#EF4444" : "#E2E8F0" }}
                onFocus={(e) => { if (!loginError) e.target.style.borderColor = "#4F6EF7"; }}
                onBlur={(e) => { if (!loginError) e.target.style.borderColor = "#E2E8F0"; }}
              />
              {loginError && (
                <p className="text-sm mt-1.5 font-medium" style={{ color: "#EF4444" }}>
                  Incorrect password. Try again.
                  {loginAttempts && (
                    <span className="ml-1 opacity-75">
                      ({loginAttempts.count}/{loginAttempts.max} attempts)
                    </span>
                  )}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-white py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                boxShadow: "0 6px 20px rgba(79,110,247,0.3)",
              }}
            >
              {submitting ? "Checking..." : "Sign In"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#080B1A" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-4 border-t-transparent"
          style={{ borderColor: "#4F6EF7", borderTopColor: "transparent" }}
        />
        <p className="text-slate-400 text-sm font-medium">Fetching data…</p>
      </div>
    );
  }

  /* ─── DASHBOARD ─── */
  return (
    <div className="min-h-screen" style={{ background: "#080B1A" }}>

      {/* Top Bar */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{ background: "rgba(8,11,26,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(79,110,247,0.15)" }}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(79,110,247,0.2)" }}
            >
              <Lock className="w-4 h-4" style={{ color: "#4F6EF7" }} />
            </div>
            <span className="text-white font-bold text-sm tracking-wide">AzeroTech Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => void handleLogout()}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8">

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8"
        >
          {[
            { label: "Appointments", value: appointments.length, color: "#4F6EF7" },
            { label: "Reservations",  value: reservations.length,  color: "#8B5CF6" },
            { label: "Customers",     value: customers.length,      color: "#06B6D4" },
            { label: "Pending",       value: pendingCount,          color: "#EAB308" },
            { label: "Out of Stock",  value: outOfStockCount,       color: "#EF4444" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Tab Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease }}
          className="flex gap-2 mb-6 flex-wrap"
        >
          {(
            [
              { key: "appointments", Icon: Wrench,      label: "Appointments" },
              { key: "reservations", Icon: ShoppingBag, label: "Reservations" },
              { key: "customers",    Icon: Users,       label: "Customers" },
              { key: "inventory",    Icon: Package,     label: "Inventory" },
              { key: "lcd-stock",    Icon: Monitor,     label: "LCD Stock" },
            ] as const
          ).map(({ key, Icon, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
                style={
                  active
                    ? { background: "linear-gradient(135deg, #4F6EF7, #6B84FF)", color: "white", boxShadow: "0 4px 14px rgba(79,110,247,0.3)" }
                    : { background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">

          {/* ── Appointments ── */}
          {activeTab === "appointments" && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
            >
              {appointments.length === 0 ? (
                <EmptyState label="appointments" detail="Appointments submitted from the booking form will appear here." />
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Search + Sort */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Search by Appointment ID, name, or phone…"
                      value={apptSearch}
                      onChange={(e) => setApptSearch(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "white",
                      }}
                    />
                    <div className="relative flex items-center">
                      <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 pointer-events-none" style={{ color: "#64748B" }} />
                      <select
                        value={apptSort}
                        onChange={(e) => setApptSort(e.target.value as typeof apptSort)}
                        className="pl-8 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none cursor-pointer appearance-none"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "#94A3B8",
                        }}
                      >
                        <option value="date-asc"   style={{ background: "#0F1535" }}>Closest Date</option>
                        <option value="date-desc"  style={{ background: "#0F1535" }}>Latest Date</option>
                        <option value="name"       style={{ background: "#0F1535" }}>Name A–Z</option>
                        <option value="Pending"    style={{ background: "#0F1535" }}>Pending</option>
                        <option value="Confirmed"  style={{ background: "#0F1535" }}>Confirmed</option>
                        <option value="Completed"  style={{ background: "#0F1535" }}>Completed</option>
                        <option value="Cancelled"  style={{ background: "#0F1535" }}>Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const filtered = apptSearch.trim()
                      ? appointments.filter((a) => {
                          const q = apptSearch.trim().toLowerCase();
                          return (
                            (a.appointmentId ?? "").toLowerCase().includes(q) ||
                            a.name.toLowerCase().includes(q) ||
                            (a.phone ?? "").includes(q)
                          );
                        })
                      : appointments;

                    const isStatusFilter = ["Pending", "Confirmed", "Completed", "Cancelled"].includes(apptSort);
                    const statusFiltered = isStatusFilter
                      ? filtered.filter((a) => a.status === apptSort)
                      : filtered;

                    const sorted = [...statusFiltered].sort((a, b) => {
                      if (apptSort === "date-desc") {
                        const ta = (a.date ?? "") + parseTimeToMinutes(a.time).toString().padStart(5, "0");
                        const tb = (b.date ?? "") + parseTimeToMinutes(b.time).toString().padStart(5, "0");
                        return tb.localeCompare(ta);
                      }
                      if (apptSort === "name") return a.name.localeCompare(b.name);
                      // default: closest date (also used for status filters)
                      const ta = (a.date ?? "") + parseTimeToMinutes(a.time).toString().padStart(5, "0");
                      const tb = (b.date ?? "") + parseTimeToMinutes(b.time).toString().padStart(5, "0");
                      return ta.localeCompare(tb);
                    });

                    if (sorted.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-slate-400 font-semibold">No appointments match that search.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sorted.map((appt, idx) => (
                          <motion.div
                            key={appt.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: idx * 0.04, ease }}
                            className="rounded-2xl p-5 flex flex-col gap-4"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                {appt.appointmentId && (
                                  <span
                                    className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md mb-1.5 inline-block"
                                    style={{ background: "rgba(79,110,247,0.12)", color: "#8B9EFF" }}
                                  >
                                    {appt.appointmentId}
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 shrink-0" style={{ color: "#8B9EFF" }} />
                                  <span className="text-white font-bold truncate">{appt.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "#64748B" }} />
                                  <span className="text-slate-400 text-sm">{appt.phone}</span>
                                </div>
                              </div>
                              <StatusBadge status={appt.status} />
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-2">
                              <Detail icon={<Wrench className="w-3.5 h-3.5" />} label="Service" value={appt.service} />
                              <Detail icon={<CalendarDays className="w-3.5 h-3.5" />} label="Date" value={formatDate(appt.date)} />
                              <Detail icon={<Clock className="w-3.5 h-3.5" />} label="Time" value={appt.time} />
                              <Detail icon={<User className="w-3.5 h-3.5" />} label="Device" value={`${appt.brand} ${appt.deviceType}`} />
                            </div>

                            {/* Problem */}
                            {appt.problem && (
                              <div
                                className="rounded-xl px-3 py-2.5 text-sm text-slate-300 line-clamp-2"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                              >
                                <span className="text-slate-500 font-medium mr-1.5">Problem:</span>{appt.problem}
                              </div>
                            )}

                            {/* Footer */}
                            <div
                              className="flex items-center justify-between gap-2 pt-3 border-t mt-4"
                              style={{ borderColor: "rgba(255,255,255,0.07)" }}
                            >
                              <span className="text-slate-500 text-xs shrink-0 sm:hidden">{formatSubmittedDate(appt.submittedAt)}</span>
                              <span className="text-slate-500 text-xs shrink-0 hidden sm:inline">{formatSubmittedAt(appt.submittedAt)}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setEditingAppt(appt)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                                  style={{ background: "rgba(79,110,247,0.12)", color: "#8B9EFF" }}
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <StatusSelect value={appt.status} onChange={(s) => updateAppointmentStatus(appt.id, s)} />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Reservations ── */}
          {activeTab === "reservations" && (
            <motion.div
              key="reservations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
            >
              {reservations.length === 0 ? (
                <EmptyState label="reservations" detail="Accessory reservations submitted from the shop will appear here." />
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Search + Sort */}
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#64748B" }} />
                      <input
                        type="text"
                        value={resSearch}
                        onChange={(e) => setResSearch(e.target.value)}
                        placeholder="Search by name, phone, or product…"
                        className="w-full pl-8 pr-4 py-3 rounded-xl text-sm focus:outline-none placeholder:text-slate-500"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "#E2E8F0",
                        }}
                      />
                    </div>
                    <div className="relative flex items-center shrink-0">
                      <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 pointer-events-none" style={{ color: "#64748B" }} />
                      <select
                        value={resSort}
                        onChange={(e) => setResSort(e.target.value as typeof resSort)}
                        className="pl-8 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none cursor-pointer appearance-none"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "#94A3B8",
                        }}
                      >
                        <option value="date-asc"   style={{ background: "#0F1535" }}>Closest Date</option>
                        <option value="date-desc"  style={{ background: "#0F1535" }}>Latest Date</option>
                        <option value="name"       style={{ background: "#0F1535" }}>Name A–Z</option>
                        <option value="Pending"    style={{ background: "#0F1535" }}>Pending</option>
                        <option value="Confirmed"  style={{ background: "#0F1535" }}>Confirmed</option>
                        <option value="Completed"  style={{ background: "#0F1535" }}>Completed</option>
                        <option value="Cancelled"  style={{ background: "#0F1535" }}>Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const query = resSearch.trim().toLowerCase();
                    const searched = query
                      ? reservations.filter(
                          (r) =>
                            r.name.toLowerCase().includes(query) ||
                            r.phone.includes(query) ||
                            r.productName.toLowerCase().includes(query)
                        )
                      : reservations;

                    const isStatusFilter = ["Pending", "Confirmed", "Completed", "Cancelled"].includes(resSort);
                    const statusFiltered = isStatusFilter
                      ? searched.filter((r) => r.status === resSort)
                      : searched;

                    const sorted = [...statusFiltered].sort((a, b) => {
                      if (resSort === "date-desc") {
                        return b.pickupDate.localeCompare(a.pickupDate);
                      }
                      if (resSort === "name") return a.name.localeCompare(b.name);
                      return a.pickupDate.localeCompare(b.pickupDate);
                    });

                    if (sorted.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-slate-400 font-semibold">
                            {query ? `No reservations found for "${resSearch}".` : "No reservations match that filter."}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sorted.map((res, idx) => (
                          <motion.div
                            key={res.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: idx * 0.04, ease }}
                            className="rounded-2xl p-5 flex flex-col gap-4"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 shrink-0" style={{ color: "#C4B5FD" }} />
                                  <span className="text-white font-bold truncate">{res.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "#64748B" }} />
                                  <span className="text-slate-400 text-sm">{res.phone}</span>
                                </div>
                              </div>
                              <StatusBadge status={res.status} />
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-2">
                              <Detail icon={<ShoppingBag className="w-3.5 h-3.5" />} label="Product" value={res.productName} />
                              <Detail icon={<span className="text-xs font-bold">₱</span>} label="Price" value={`₱${res.productPrice.toLocaleString()}`} />
                              <Detail icon={<CalendarDays className="w-3.5 h-3.5" />} label="Pickup Date" value={formatDate(res.pickupDate)} />
                              <Detail icon={<Clock className="w-3.5 h-3.5" />} label="Pickup Time" value={res.pickupTime} />
                            </div>

                            {/* Footer */}
                            <div
                              className="flex items-center justify-between gap-2 pt-3 border-t mt-4"
                              style={{ borderColor: "rgba(255,255,255,0.07)" }}
                            >
                              <span className="text-slate-500 text-xs shrink-0 sm:hidden">{formatSubmittedDate(res.submittedAt)}</span>
                              <span className="text-slate-500 text-xs shrink-0 hidden sm:inline">{formatSubmittedAt(res.submittedAt)}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setEditingRes(res)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                                  style={{ background: "rgba(139,92,246,0.12)", color: "#C4B5FD" }}
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <StatusSelect value={res.status} onChange={(s) => updateReservationStatus(res.id, s)} />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Inventory ── */}
          {activeTab === "inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
            >
              {/* Inventory header */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-slate-400 text-sm font-semibold">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                    color: "white",
                    boxShadow: "0 4px 14px rgba(79,110,247,0.3)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              {products.length === 0 ? (
                <EmptyState label="products" detail="No products yet. Click 'Add Product' to get started, or visit /api/products/seed to seed the database." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product, idx) => {
                    const { color, bg, label } = stockLevel(product.stock);
                    const stock = product.stock ?? 0;
                    const inputVal = stockInputs[product.id] ?? String(stock);
                    const isConfirmingDelete = confirmDeleteId === product.id;
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04, ease }}
                        className="rounded-2xl p-5 flex flex-col gap-4"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span
                              className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md mb-1.5 inline-block"
                              style={{ background: "rgba(79,110,247,0.12)", color: "#8B9EFF" }}
                            >
                              #{String(product.id).padStart(3, "0")}
                            </span>
                            <p className="text-white font-bold text-sm leading-snug truncate">{product.name}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{product.category} · {product.price}</p>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0"
                            style={{ background: bg, color }}
                          >
                            {label}
                          </span>
                        </div>

                        {/* Stock count display */}
                        <div
                          className="rounded-xl px-4 py-3 flex items-center justify-between"
                          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}33` }}
                        >
                          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Stock</span>
                          <span className="text-2xl font-bold" style={{ color }}>{stock}</span>
                        </div>

                        {/* +/- controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStock(product.id, stock - 1)}
                            disabled={stock <= 0}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
                            title="Remove 1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            min={0}
                            value={inputVal}
                            onChange={(e) =>
                              setStockInputs((prev) => ({ ...prev, [product.id]: e.target.value }))
                            }
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 0) {
                                updateStock(product.id, val);
                              }
                              setStockInputs((prev) => {
                                const next = { ...prev };
                                delete next[product.id];
                                return next;
                              });
                            }}
                            className="flex-1 text-center text-white font-bold rounded-xl py-2.5 focus:outline-none text-sm"
                            style={{
                              background: "rgba(255,255,255,0.07)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                          />

                          <button
                            onClick={() => updateStock(product.id, stock + 1)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: "rgba(22,163,74,0.15)", color: "#16A34A" }}
                            title="Add 1"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick-set buttons */}
                        <div className="flex gap-2">
                          {[5, 10, 20].map((n) => (
                            <button
                              key={n}
                              onClick={() => updateStock(product.id, n)}
                              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                              style={{ background: "rgba(79,110,247,0.15)", color: "#8B9EFF" }}
                            >
                              Set {n}
                            </button>
                          ))}
                        </div>

                        {/* Edit / Remove actions */}
                        <div
                          className="flex gap-2 pt-1 border-t"
                          style={{ borderColor: "rgba(255,255,255,0.07)" }}
                        >
                          <button
                            onClick={() => { setEditingProduct(product); setConfirmDeleteId(null); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                            style={{ background: "rgba(79,110,247,0.12)", color: "#8B9EFF" }}
                          >
                            <Pencil className="w-3 h-3" />
                            Edit Info
                          </button>
                          {isConfirmingDelete ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444" }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                              style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444" }}
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── LCD Stock ── */}
          {activeTab === "lcd-stock" && (
            <motion.div
              key="lcd-stock"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
            >
              {/* LCD Stock header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-semibold">
                  {lcdItems.length} LCD type{lcdItems.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setShowAddLcdModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                    color: "white",
                    boxShadow: "0 4px 14px rgba(79,110,247,0.3)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add LCD Type
                </button>
              </div>

              {/* Search + Sort */}
              {lcdItems.length > 0 && (
                <div className="flex gap-3 mb-5">
                  <input
                    type="text"
                    value={lcdSearch}
                    onChange={(e) => setLcdSearch(e.target.value)}
                    placeholder="Search LCD types…"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  />
                  <select
                    value={lcdSort}
                    onChange={(e) => setLcdSort(e.target.value as typeof lcdSort)}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#94A3B8" }}
                  >
                    <option value="name-asc"  style={{ background: "#0F1535" }}>Name A–Z</option>
                    <option value="name-desc" style={{ background: "#0F1535" }}>Name Z–A</option>
                    <option value="low-stock" style={{ background: "#0F1535" }}>Low Stock</option>
                    <option value="no-stock"  style={{ background: "#0F1535" }}>No Stock</option>
                  </select>
                </div>
              )}

              {lcdItems.length === 0 ? (
                <EmptyState label="LCD types" detail="No LCD types yet. Click 'Add LCD Type' to start tracking your LCD replacement stock." />
              ) : (() => {
                const filtered = lcdItems
                  .filter((item) => item.name.toLowerCase().includes(lcdSearch.toLowerCase()))
                  .sort((a, b) => {
                    if (lcdSort === "name-asc")  return a.name.localeCompare(b.name);
                    if (lcdSort === "name-desc") return b.name.localeCompare(a.name);
                    if (lcdSort === "low-stock") return a.stock - b.stock;
                    if (lcdSort === "no-stock")  return (a.stock === 0 ? 0 : 1) - (b.stock === 0 ? 0 : 1);
                    return 0;
                  });
                if (filtered.length === 0) return (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-slate-400 font-semibold">No results for &ldquo;{lcdSearch}&rdquo;</p>
                  </div>
                );
                return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((item, idx) => {
                    const { color, bg, label } = lcdStockLevel(item.stock);
                    const inputVal = lcdStockInputs[item.id] ?? String(item.stock);
                    const isConfirmingDelete = confirmDeleteLcdId === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.04, ease }}
                        className="rounded-2xl p-5 flex flex-col gap-4"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Monitor className="w-3.5 h-3.5 shrink-0" style={{ color: "#8B9EFF" }} />
                              <span
                                className="text-xs font-mono font-semibold"
                                style={{ color: "#8B9EFF" }}
                              >
                                LCD
                              </span>
                            </div>
                            <p className="text-white font-bold text-sm leading-snug">{item.name}</p>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0"
                            style={{ background: bg, color }}
                          >
                            {label}
                          </span>
                        </div>

                        {/* Stock count display */}
                        <div
                          className="rounded-xl px-4 py-3 flex items-center justify-between"
                          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}33` }}
                        >
                          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Stock</span>
                          <span className="text-2xl font-bold" style={{ color }}>{item.stock}</span>
                        </div>

                        {/* +/- controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateLcdStock(item.id, item.stock - 1)}
                            disabled={item.stock <= 0}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
                            title="Remove 1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            min={0}
                            value={inputVal}
                            onChange={(e) =>
                              setLcdStockInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 0) {
                                updateLcdStock(item.id, val);
                              }
                              setLcdStockInputs((prev) => {
                                const next = { ...prev };
                                delete next[item.id];
                                return next;
                              });
                            }}
                            className="flex-1 text-center text-white font-bold rounded-xl py-2.5 focus:outline-none text-sm"
                            style={{
                              background: "rgba(255,255,255,0.07)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                          />

                          <button
                            onClick={() => updateLcdStock(item.id, item.stock + 1)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: "rgba(22,163,74,0.15)", color: "#16A34A" }}
                            title="Add 1"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Edit / Remove actions */}
                        <div
                          className="flex gap-2 pt-1 border-t"
                          style={{ borderColor: "rgba(255,255,255,0.07)" }}
                        >
                          <button
                            onClick={() => { setEditingLcd(item); setConfirmDeleteLcdId(null); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                            style={{ background: "rgba(79,110,247,0.12)", color: "#8B9EFF" }}
                          >
                            <Pencil className="w-3 h-3" />
                            Edit Name
                          </button>
                          {isConfirmingDelete ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => deleteLcdItem(item.id)}
                                className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444" }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteLcdId(null)}
                                className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteLcdId(item.id)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                              style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444" }}
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                );
              })()}
            </motion.div>
          )}

          {/* ── Customers ── */}
          {activeTab === "customers" && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-semibold">
                  {customers.length} customer{customers.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setAddingCustomer(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #06B6D4, #22D3EE)",
                    color: "white",
                    boxShadow: "0 4px 14px rgba(6,182,212,0.3)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Walk-In
                </button>
              </div>

              {/* Search + Sort */}
              {customers.length > 0 && (
                <div className="flex gap-3 mb-5 flex-wrap sm:flex-nowrap">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#64748B" }} />
                    <input
                      type="text"
                      value={custSearch}
                      onChange={(e) => setCustSearch(e.target.value)}
                      placeholder="Search by name or phone…"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                    />
                  </div>
                  <div className="relative flex items-center shrink-0">
                    <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 pointer-events-none" style={{ color: "#64748B" }} />
                    <select
                      value={custSort}
                      onChange={(e) => setCustSort(e.target.value as typeof custSort)}
                      className="pl-8 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none cursor-pointer appearance-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "#94A3B8",
                      }}
                    >
                      <option value="latest"  style={{ background: "#0F1535" }}>Latest Activity</option>
                      <option value="oldest"  style={{ background: "#0F1535" }}>Oldest Activity</option>
                      <option value="name"    style={{ background: "#0F1535" }}>Name A–Z</option>
                      <option value="visits"  style={{ background: "#0F1535" }}>Most Visits</option>
                    </select>
                  </div>
                </div>
              )}

              {customers.length === 0 ? (
                <EmptyState label="customers" detail="Customer profiles are auto-created when appointments or reservations are submitted. Add walk-ins manually." />
              ) : (() => {
                const q = custSearch.trim().toLowerCase();
                const filtered = q
                  ? customers.filter(
                      (c) =>
                        c.name.toLowerCase().includes(q) ||
                        c.phone.includes(q)
                    )
                  : customers;

                const visitCount = (c: CustomerEntry) =>
                  (c.appointments?.length ?? 0) + (c.reservations?.length ?? 0) + (c.serviceRecords?.length ?? 0);

                const lastActivity = (c: CustomerEntry): string => {
                  const dates: string[] = [
                    ...(c.appointments?.map((a) => a.submittedAt) ?? []),
                    ...(c.reservations?.map((r) => r.submittedAt) ?? []),
                    ...(c.serviceRecords?.map((s) => s.createdAt) ?? []),
                    c.createdAt,
                  ];
                  return dates.sort().at(-1) ?? c.createdAt;
                };

                const sorted = [...filtered].sort((a, b) => {
                  if (custSort === "name") return a.name.localeCompare(b.name);
                  if (custSort === "visits") return visitCount(b) - visitCount(a);
                  if (custSort === "oldest") return lastActivity(a).localeCompare(lastActivity(b));
                  return lastActivity(b).localeCompare(lastActivity(a));
                });

                if (sorted.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-slate-400 font-semibold">No customers match that search.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sorted.map((cust, idx) => {
                      const isConfirmingDelete = confirmDeleteCustomerId === cust.id;
                      const visits = visitCount(cust);
                      const hasMismatches = cust.nameMismatches && cust.nameMismatches.length > 0;
                      const historyOpen = expandedHistory.has(cust.id);
                      const historyCount = (cust.appointments?.length ?? 0) + (cust.reservations?.length ?? 0) + (cust.serviceRecords?.length ?? 0);
                      return (
                        <motion.div
                          key={cust.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.03, ease }}
                          className="rounded-2xl overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          {/* Mismatch warning */}
                          {hasMismatches && (
                            <div
                              className="px-5 py-3 flex items-start gap-3"
                              style={{ background: "rgba(234,179,8,0.10)", borderBottom: "1px solid rgba(234,179,8,0.20)" }}
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#EAB308" }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: "#EAB308" }}>Name mismatch detected</p>
                                {cust.nameMismatches.map((m, i) => (
                                  <p key={i} className="text-xs text-slate-400 mt-0.5">
                                    Submitted as &quot;{m.submittedName}&quot; on {formatSubmittedDate(m.date)}
                                  </p>
                                ))}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => setEditingCustomer(cust)}
                                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                                  style={{ background: "rgba(234,179,8,0.15)", color: "#EAB308" }}
                                >
                                  Update Name
                                </button>
                                <button
                                  onClick={() => dismissMismatches(cust.id)}
                                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                                  style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8" }}
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="p-5">
                            {/* Customer header */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Users className="w-4 h-4" style={{ color: "#22D3EE" }} />
                                  <span className="text-white font-bold">{cust.name}</span>
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                                    style={{
                                      background: cust.type === "walk-in" ? "rgba(234,179,8,0.15)" : "rgba(6,182,212,0.15)",
                                      color: cust.type === "walk-in" ? "#EAB308" : "#22D3EE",
                                    }}
                                  >
                                    {cust.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                                  <span className="text-slate-400 text-sm">{cust.phone}</span>
                                  <span className="text-slate-600 text-xs">·</span>
                                  <span className="text-slate-500 text-xs">{visits} visit{visits !== 1 ? "s" : ""}</span>
                                  <span className="text-slate-600 text-xs">·</span>
                                  <span className="text-slate-500 text-xs">Since {formatDate(cust.createdAt.slice(0, 10))}</span>
                                </div>
                              </div>
                              {/* History toggle button */}
                              <button
                                onClick={() => toggleHistory(cust.id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 shrink-0"
                                style={{
                                  background: historyOpen ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.06)",
                                  color: historyOpen ? "#22D3EE" : "#94A3B8",
                                  border: `1px solid ${historyOpen ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.08)"}`,
                                }}
                              >
                                <ClipboardList className="w-3.5 h-3.5" />
                                History{historyCount > 0 ? ` (${historyCount})` : ""}
                                <ChevronDown
                                  className="w-3.5 h-3.5 transition-transform duration-200"
                                  style={{ transform: historyOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                />
                              </button>
                            </div>

                            {/* History panel */}
                            <AnimatePresence initial={false}>
                              {historyOpen && (
                                <motion.div
                                  key="history"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                  style={{ overflow: "hidden" }}
                                >
                                  <div
                                    className="mb-4 rounded-xl p-4 flex flex-col gap-3"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                                  >
                                    {historyCount === 0 && (
                                      <p className="text-slate-500 text-sm text-center py-2">No history yet.</p>
                                    )}

                                    {/* Appointments */}
                                    {(cust.appointments?.length ?? 0) > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8B9EFF" }}>Appointments</p>
                                        <div className="flex flex-col gap-1.5">
                                          {cust.appointments!.map((a) => (
                                            <div
                                              key={a.id}
                                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                                              style={{ background: "rgba(79,110,247,0.08)", border: "1px solid rgba(79,110,247,0.15)" }}
                                            >
                                              <div className="min-w-0">
                                                <p className="text-sm text-white font-semibold truncate">{a.service}</p>
                                                <p className="text-xs text-slate-500">{formatDate(a.date)} · {a.brand} {a.deviceType}</p>
                                              </div>
                                              <StatusBadge status={a.status} />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Reservations */}
                                    {(cust.reservations?.length ?? 0) > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#C4B5FD" }}>Reservations</p>
                                        <div className="flex flex-col gap-1.5">
                                          {cust.reservations!.map((r) => (
                                            <div
                                              key={r.id}
                                              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                                              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}
                                            >
                                              <div className="min-w-0">
                                                <p className="text-sm text-white font-semibold truncate">{r.productName}</p>
                                                <p className="text-xs text-slate-500">₱{r.productPrice.toLocaleString()} · Pickup: {formatDate(r.pickupDate)}</p>
                                              </div>
                                              <StatusBadge status={r.status} />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Walk-in service records */}
                                    {(cust.serviceRecords?.length ?? 0) > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#34D399" }}>Walk-In Services</p>
                                        <div className="flex flex-col gap-1.5">
                                          {cust.serviceRecords!.map((s) => (
                                            <div
                                              key={s.id}
                                              className="flex items-start justify-between gap-3 px-3 py-2 rounded-xl"
                                              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
                                            >
                                              <div className="min-w-0 flex-1">
                                                <p className="text-sm text-white font-semibold truncate">{s.service}</p>
                                                <p className="text-xs text-slate-500">{formatDate(s.date)} · {s.device}{s.cost > 0 ? ` · ₱${s.cost.toLocaleString()}` : ""}</p>
                                                {s.notes && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">Note: {s.notes}</p>}
                                              </div>
                                              <button
                                                onClick={() => deleteServiceRecord(cust.id, s.id)}
                                                className="shrink-0 p-1.5 rounded-lg transition-all hover:opacity-80"
                                                style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444" }}
                                                title="Delete record"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div
                              className="flex items-center gap-2 pt-3 border-t flex-wrap"
                              style={{ borderColor: "rgba(255,255,255,0.07)" }}
                            >
                              <button
                                onClick={() => setAddingRecordFor(cust)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                                style={{ background: "rgba(16,185,129,0.12)", color: "#34D399" }}
                              >
                                <FileText className="w-3 h-3" />
                                Add Service Record
                              </button>
                              <button
                                onClick={() => setEditingCustomer(cust)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                                style={{ background: "rgba(6,182,212,0.12)", color: "#22D3EE" }}
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                              {isConfirmingDelete ? (
                                <div className="flex gap-1 ml-auto">
                                  <button
                                    onClick={() => deleteCustomer(cust.id)}
                                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                    style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444" }}
                                  >
                                    Confirm Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteCustomerId(null)}
                                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                    style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteCustomerId(cust.id)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 ml-auto"
                                  style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444" }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Appointment edit modal */}
      <AnimatePresence>
        {editingAppt && (
          <AppointmentEditModal
            key="appt-edit-modal"
            appt={editingAppt}
            onSave={(data) => updateAppointmentFull(editingAppt.id, data)}
            onClose={() => setEditingAppt(null)}
            onDelete={() => deleteAppointment(editingAppt.id)}
          />
        )}
      </AnimatePresence>

      {/* Reservation edit modal */}
      <AnimatePresence>
        {editingRes && (
          <ReservationEditModal
            key="res-edit-modal"
            res={editingRes}
            onSave={(data) => updateReservationFull(editingRes.id, data)}
            onClose={() => setEditingRes(null)}
            onDelete={() => deleteReservation(editingRes.id)}
          />
        )}
      </AnimatePresence>

      {/* Product modals */}
      {/* LCD modals */}
      <AnimatePresence>
        {showAddLcdModal && (
          <LcdFormModal
            key="lcd-add-modal"
            title="Add LCD Type"
            initial={{ name: "", stock: 0 }}
            onSubmit={(name, stock) => addLcdItem(name, stock)}
            onClose={() => setShowAddLcdModal(false)}
          />
        )}
        {editingLcd && (
          <LcdFormModal
            key="lcd-edit-modal"
            title="Edit LCD Type"
            initial={{ name: editingLcd.name, stock: editingLcd.stock }}
            hideStock
            onSubmit={(name) => editLcdName(editingLcd.id, name)}
            onClose={() => setEditingLcd(null)}
          />
        )}
      </AnimatePresence>

      {/* Customer modals */}
      <AnimatePresence>
        {addingCustomer && (
          <AddCustomerModal
            key="add-customer-modal"
            onSubmit={addCustomer}
            onClose={() => setAddingCustomer(false)}
          />
        )}
        {editingCustomer && (
          <EditCustomerModal
            key="edit-customer-modal"
            customer={editingCustomer}
            onSubmit={(data) => editCustomer(editingCustomer.id, data)}
            onClose={() => setEditingCustomer(null)}
          />
        )}
        {addingRecordFor && (
          <AddServiceRecordModal
            key="add-record-modal"
            customerName={addingRecordFor.name}
            onSubmit={(data) => addServiceRecord(addingRecordFor.id, data)}
            onClose={() => setAddingRecordFor(null)}
          />
        )}
      </AnimatePresence>

      {(() => {
        const categories = Array.from(new Set(products.map((p) => p.category))).sort();
        return (
          <AnimatePresence>
            {showAddModal && (
              <ProductFormModal
                key="add-modal"
                title="Add Product"
                initial={{ name: "", price: "", category: "", image: "", stock: 0 }}
                categories={categories}
                showStock
                onSubmit={addProduct}
                onClose={() => setShowAddModal(false)}
              />
            )}
            {editingProduct && (
              <ProductFormModal
                key="edit-modal"
                title="Save Changes"
                initial={{
                  name: editingProduct.name,
                  price: editingProduct.price,
                  category: editingProduct.category,
                  image: editingProduct.image,
                }}
                categories={categories}
                showStock={false}
                onSubmit={(data) => editProductInfo(editingProduct.id, data)}
                onClose={() => setEditingProduct(null)}
              />
            )}
          </AnimatePresence>
        );
      })()}
    </div>
  );
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const { bg, color } = STATUS_STYLES[status];
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0"
      style={{ background: bg, color }}
    >
      {status}
    </span>
  );
}

function StatusSelect({ value, onChange }: { value: EntryStatus; onChange: (s: EntryStatus) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EntryStatus)}
      className="px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: STATUS_STYLES[value].color,
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} style={{ background: "#0F1535", color: STATUS_STYLES[s].color }}>
          {s}
        </option>
      ))}
    </select>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-1.5 mb-1 text-slate-500">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-white text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function EmptyState({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ClipboardList className="w-12 h-12 mb-4 opacity-20 text-white" />
      <p className="text-slate-300 font-semibold text-lg mb-2">No {label} yet</p>
      <p className="text-slate-500 text-sm max-w-xs">{detail}</p>
    </div>
  );
}

function AppointmentEditModal({
  appt,
  onSave,
  onClose,
  onDelete,
}: {
  appt: AppointmentEntry;
  onSave: (data: Partial<AppointmentEntry>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(appt.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [phone, setPhone] = useState(appt.phone);
  const [service, setService] = useState(appt.service);
  const [date, setDate] = useState(appt.date);
  const [time, setTime] = useState(appt.time);
  const [brand, setBrand] = useState(appt.brand);
  const [deviceType, setDeviceType] = useState(appt.deviceType);
  const [problem, setProblem] = useState(appt.problem ?? "");
  const [repairStage, setRepairStage] = useState<string>(appt.repairStage ?? "");

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, phone, service, date, time, brand, deviceType, problem: problem || undefined, repairStage: repairStage || null });
  };

  const ease2 = [0.22, 1, 0.36, 1] as [number, number, number, number];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: ease2 }}
        className="w-full max-w-lg rounded-2xl p-6 my-8"
        style={{
          background: "#0D1225",
          border: "1px solid rgba(79,110,247,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Edit Appointment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
              style={inputStyle}
            >
              <option value="Phone Repair" style={{ background: "#0F1535" }}>Phone Repair</option>
              <option value="Laptop / Desktop Repair" style={{ background: "#0F1535" }}>Laptop / Desktop Repair</option>
              <option value="Device Checkup" style={{ background: "#0F1535" }}>Device Checkup</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Time Slot</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s} style={{ background: "#0F1535" }}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Device Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Device Type</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              >
                <option value="Phone" style={{ background: "#0F1535" }}>Phone</option>
                <option value="Laptop" style={{ background: "#0F1535" }}>Laptop</option>
                <option value="Desktop" style={{ background: "#0F1535" }}>Desktop</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Problem Description <span className="normal-case font-normal text-slate-600">(optional)</span>
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Repair Stage <span className="normal-case font-normal text-slate-600">(optional)</span>
            </label>
            <select
              value={repairStage}
              onChange={(e) => setRepairStage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
              style={inputStyle}
            >
              <option value="" style={{ background: "#0F1535" }}>— Not set —</option>
              <option value="Device Received" style={{ background: "#0F1535" }}>Device Received</option>
              <option value="Waiting for Parts" style={{ background: "#0F1535" }}>Waiting for Parts</option>
              <option value="Fixing" style={{ background: "#0F1535" }}>Fixing</option>
              <option value="Ready for Pickup" style={{ background: "#0F1535" }}>Ready for Pickup</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            {confirmDelete ? (
              <>
                <span className="flex-1 flex items-center text-sm text-slate-400">Delete this appointment?</span>
                <button
                  type="button"
                  onClick={() => { onDelete(); onClose(); }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#F87171" }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="py-3 px-4 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#F87171" }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                    boxShadow: "0 4px 14px rgba(79,110,247,0.3)",
                  }}
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ReservationEditModal({
  res,
  onSave,
  onClose,
  onDelete,
}: {
  res: ReservationEntry;
  onSave: (data: Partial<ReservationEntry>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(res.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [phone, setPhone] = useState(res.phone);
  const [productName, setProductName] = useState(res.productName);
  const [productPrice, setProductPrice] = useState(String(res.productPrice));
  const [pickupDate, setPickupDate] = useState(res.pickupDate);
  const [pickupTime, setPickupTime] = useState(res.pickupTime);

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const ease2 = [0.22, 1, 0.36, 1] as [number, number, number, number];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, phone, productName, productPrice: parseFloat(productPrice) || 0, pickupDate, pickupTime });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: ease2 }}
        className="w-full max-w-lg rounded-2xl p-6 my-8"
        style={{
          background: "#0D1225",
          border: "1px solid rgba(139,92,246,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Edit Reservation</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Price (₱)</label>
              <input
                type="number"
                min={0}
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pickup Date</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pickup Time</label>
              <input
                type="text"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="e.g. 2:00 PM"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {confirmDelete ? (
              <>
                <span className="flex-1 flex items-center text-sm text-slate-400">Delete this reservation?</span>
                <button
                  type="button"
                  onClick={() => { onDelete(); onClose(); }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#F87171" }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="py-3 px-4 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#F87171" }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
                    boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
                  }}
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}

type ProductFormData = { name: string; price: string; category: string; image: string; stock: number };

function ProductFormModal({
  title,
  initial,
  categories,
  showStock,
  onSubmit,
  onClose,
}: {
  title: string;
  initial: Partial<ProductFormData>;
  categories: string[];
  showStock: boolean;
  onSubmit: (data: ProductFormData) => void;
  onClose: () => void;
}) {
  const initialCategory = initial.category ?? "";
  const isExisting = categories.includes(initialCategory);

  const [name, setName] = useState(initial.name ?? "");
  // category select value: existing category or "other"
  const [categorySelect, setCategorySelect] = useState(
    initialCategory && !isExisting ? "other" : initialCategory
  );
  const [customCategory, setCustomCategory] = useState(
    initialCategory && !isExisting ? initialCategory : ""
  );
  // price: strip ₱ prefix from stored value
  const [price, setPrice] = useState(
    (initial.price ?? "").replace(/^₱/, "").trim()
  );
  const [image, setImage] = useState(initial.image ?? "");
  const [stock, setStock] = useState(String(initial.stock ?? 0));

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const resolvedCategory = categorySelect === "other" ? customCategory.trim() : categorySelect;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !resolvedCategory || !price) return;
    onSubmit({
      name: name.trim(),
      price: `₱${price}`,
      category: resolvedCategory,
      image: image.trim(),
      stock: parseInt(stock) || 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: "#0D1225",
          border: "1px solid rgba(79,110,247,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Samsung Fast Charger"
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
              style={inputStyle}
            />
          </div>

          {/* Category — dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={categorySelect}
              onChange={(e) => setCategorySelect(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none cursor-pointer"
              style={{ ...inputStyle, color: categorySelect ? "white" : "#475569" }}
            >
              <option value="" disabled style={{ background: "#0D1225" }}>Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c} style={{ background: "#0D1225" }}>{c}</option>
              ))}
              <option value="other" style={{ background: "#0D1225" }}>Other…</option>
            </select>
            {categorySelect === "other" && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter new category"
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600 mt-2"
                style={inputStyle}
                autoFocus
              />
            )}
          </div>

          {/* Price — number with ₱ prefix */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Price
            </label>
            <div
              className="flex items-center rounded-xl overflow-hidden"
              style={inputStyle}
            >
              <span
                className="pl-4 pr-2 py-3 text-sm font-bold select-none"
                style={{ color: "#8B9EFF" }}
              >
                ₱
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450"
                className="flex-1 pr-4 py-3 bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Image URL
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
              style={inputStyle}
            />
          </div>

          {/* Initial Stock (Add only) */}
          {showStock && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Initial Stock
              </label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                color: "white",
                boxShadow: "0 4px 14px rgba(79,110,247,0.3)",
              }}
            >
              {title}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddCustomerModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (name: string, phone: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const ease2 = [0.22, 1, 0.36, 1] as [number, number, number, number];
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmit(name.trim(), phone.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: ease2 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#0D1225", border: "1px solid rgba(6,182,212,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "#22D3EE" }} />
            <h2 className="text-white font-bold text-lg">Add Walk-In Customer</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Juan dela Cruz"
              autoFocus
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="09XXXXXXXXX"
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
              style={inputStyle}
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #06B6D4, #22D3EE)", boxShadow: "0 4px 14px rgba(6,182,212,0.3)" }}
            >
              Add Customer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditCustomerModal({
  customer,
  onSubmit,
  onClose,
}: {
  customer: CustomerEntry;
  onSubmit: (data: { name?: string; phone?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const ease2 = [0.22, 1, 0.36, 1] as [number, number, number, number];
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmit({ name: name.trim(), phone: phone.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: ease2 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#0D1225", border: "1px solid rgba(6,182,212,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5" style={{ color: "#22D3EE" }} />
            <h2 className="text-white font-bold text-lg">Edit Customer</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
              style={inputStyle}
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #06B6D4, #22D3EE)", boxShadow: "0 4px 14px rgba(6,182,212,0.3)" }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddServiceRecordModal({
  customerName,
  onSubmit,
  onClose,
}: {
  customerName: string;
  onSubmit: (data: { date: string; service: string; device: string; cost: number; notes: string }) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [service, setService] = useState("");
  const [device, setDevice] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const ease2 = [0.22, 1, 0.36, 1] as [number, number, number, number];
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !service.trim() || !device.trim()) return;
    onSubmit({ date, service: service.trim(), device: device.trim(), cost: parseFloat(cost) || 0, notes: notes.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: ease2 }}
        className="w-full max-w-sm rounded-2xl p-6 my-8"
        style={{ background: "#0D1225", border: "1px solid rgba(16,185,129,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: "#34D399" }} />
            <h2 className="text-white font-bold text-lg">Add Service Record</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-500 text-sm mb-5">for {customerName}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Service</label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. Screen Replacement"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Device</label>
            <input
              type="text"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              placeholder="e.g. iPhone 14 Pro"
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cost (₱)</label>
            <div className="flex items-center rounded-xl overflow-hidden" style={inputStyle}>
              <span className="pl-4 pr-2 py-3 text-sm font-bold select-none" style={{ color: "#34D399" }}>₱</span>
              <input
                type="number"
                min={0}
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="flex-1 pr-4 py-3 bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Notes <span className="normal-case font-normal text-slate-600">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes…"
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none resize-none placeholder:text-slate-600"
              style={inputStyle}
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}
            >
              Add Record
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function LcdFormModal({
  title,
  initial,
  hideStock,
  onSubmit,
  onClose,
}: {
  title: string;
  initial: { name: string; stock: number };
  hideStock?: boolean;
  onSubmit: (name: string, stock: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [stock, setStock] = useState(String(initial.stock));
  const ease2 = [0.22, 1, 0.36, 1] as [number, number, number, number];

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), parseInt(stock) || 0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: ease2 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "#0D1225",
          border: "1px solid rgba(79,110,247,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5" style={{ color: "#4F6EF7" }} />
            <h2 className="text-white font-bold text-lg">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              LCD Type Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. iPhone 13 LCD, Samsung S21 AMOLED"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none placeholder:text-slate-600"
              style={inputStyle}
            />
          </div>

          {!hideStock && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Initial Stock
              </label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                style={inputStyle}
              />
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #4F6EF7, #6B84FF)",
                color: "white",
                boxShadow: "0 4px 14px rgba(79,110,247,0.3)",
              }}
            >
              {title}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

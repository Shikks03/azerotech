"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (pathname.startsWith("/admin")) return null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/book-appointment", label: "Book Appointment" },
    { href: "/accessories", label: "Accessories" },
    { href: "/contact", label: "Contact" },
    { href: "/repair-status", label: "Track Repair" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Frosted glass panel — always on; deepens slightly on scroll for depth.
  const glassStyle: React.CSSProperties = {
    background: scrolled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
    backdropFilter: "blur(16px) saturate(140%)",
    WebkitBackdropFilter: "blur(16px) saturate(140%)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: scrolled
      ? "0 8px 32px rgba(0,0,0,0.35)"
      : "0 4px 24px rgba(0,0,0,0.20)",
  };

  return (
    <>
      <header className="fixed top-3 sm:top-4 inset-x-0 z-50 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          {/* Glass bar */}
          <div
            className="rounded-2xl transition-all duration-300"
            style={glassStyle}
          >
            <div className="flex justify-between items-center h-16 px-4 sm:px-6">
              <Link href="/" className="flex items-center">
                <Logo variant="light" />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                    style={
                      isActive(link.href)
                        ? { background: "rgba(255,255,255,0.10)" }
                        : undefined
                    }
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/book-appointment"
                  className="ml-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "rgba(79,110,247,0.22)",
                    border: "1px solid rgba(79,110,247,0.50)",
                    boxShadow: "0 4px 16px rgba(79,110,247,0.25)",
                  }}
                >
                  Book Now
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-slate-200"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation — matching glass panel below the bar */}
          {isOpen && (
            <div
              className="md:hidden mt-2 rounded-2xl overflow-hidden"
              style={glassStyle}
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-3 py-2.5 rounded-lg font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                    style={
                      isActive(link.href)
                        ? { background: "rgba(255,255,255,0.10)" }
                        : undefined
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/book-appointment"
                  className="block text-center px-5 py-3 mt-2 rounded-full font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "rgba(79,110,247,0.22)",
                    border: "1px solid rgba(79,110,247,0.50)",
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
      {/* Spacer — clears the floating bar (top offset + bar height) */}
      <div className="h-24" />
    </>
  );
}

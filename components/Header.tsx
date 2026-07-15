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

  return (
    <>
      <header
        className="fixed w-full top-0 z-50 transition-colors duration-300"
        style={{
          background: scrolled ? "rgba(8,11,26,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Logo variant="light" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-200 hover:text-white transition-colors font-medium text-sm"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/book-appointment"
                className="btn btn-primary px-6 py-2 ml-4"
              >
                Book Now
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-slate-200"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
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

        {/* Mobile Navigation */}
        {isOpen && (
          <div
            className="md:hidden"
            style={{ background: "rgba(8,11,26,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-slate-200 hover:text-white py-2 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/book-appointment"
                className="btn btn-primary w-full justify-center mt-4"
                onClick={() => setIsOpen(false)}
              >
                Book Appointment
              </Link>
            </div>
          </div>
        )}
      </header>
      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}

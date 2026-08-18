"use client";

import Link from "next/link";
import { MapPin, Clock, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: "#080B1A", borderTop: "1px solid rgba(79,110,247,0.15)" }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-16 md:py-20">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-14">

          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Logo variant="light" />
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Professional electronics repair and quality accessories in Imus, Cavite.
            </p>
          </div>

          {/* Navigate */}
          <div className="flex flex-col gap-6">
            <h4
              className="text-white text-xs uppercase tracking-widest"
              style={{ fontWeight: 700 }}
            >
              Navigate
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Home",              href: "/"                  },
                { label: "Services",          href: "/services"          },
                { label: "Book Appointment",  href: "/book-appointment"  },
                { label: "Accessories",       href: "/accessories"       },
                { label: "Contact",           href: "/contact"           },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-400 text-sm transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-6">
            <h4
              className="text-white text-xs uppercase tracking-widest"
              style={{ fontWeight: 700 }}
            >
              Contact
            </h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#F43F5E" }} />
                <span className="text-slate-400 text-sm leading-relaxed">
                  9WCC+FG Imus, Cavite
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 shrink-0" style={{ color: "#94A3B8" }} />
                <span className="text-slate-400 text-sm">Open Mon–Sun, 9AM–8PM</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 shrink-0" style={{ color: "#4F6EF7" }} />
                <a
                  href="https://m.me/azerotech"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: "#6B84FF" }}
                >
                  Message on Messenger
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-slate-500 text-sm">
            &copy; {currentYear} AzeroTech. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm flex items-center gap-1.5">
            Imus, Cavite, Philippines
            <span aria-hidden="true">&middot;</span>
            Site by{" "}
            <a
              href="https://riku.works"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              RIKU
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}

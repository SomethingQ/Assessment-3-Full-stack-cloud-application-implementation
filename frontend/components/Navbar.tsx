"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/wordsearch", label: "Word Search" },
  { to: "/wordle", label: "Wordle" },
  { to: "/activities", label: "Activities" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
  { to: "/settings", label: "Settings" },
];

function getLinkClass(isActive: boolean) {
  return `text-sm font-medium ${
    isActive
      ? "text-indigo-700 dark:text-indigo-400"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
  }`;
}

function isLinkActive(pathname: string, to: string) {
  if (to === "/") {
    return pathname === "/";
  }

  return pathname === to;
}

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="border-b border-slate-200 backdrop-blur dark:border-slate-700">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Phoneme Activity Builder
        </span>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="rounded-md bg-white p-2 hover:cursor-pointer hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
        >
          <Image src="/kebab-icon.png" alt="" width={20} height={20} className="h-5 w-5" />
        </button>

        <div className="hidden gap-6 md:flex">
          {links.map((link) => {
            const active = isLinkActive(pathname, link.to);

            return (
              <Link key={link.to} href={link.to} className={getLinkClass(active)}>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-slate-200 px-6 py-3 md:hidden dark:border-slate-700">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            {links.map((link) => {
              const active = isLinkActive(pathname, link.to);

              return (
                <Link
                  key={link.to}
                  href={link.to}
                  onClick={closeMobileMenu}
                  className={`rounded-md px-2 py-1 text-sm font-medium ${
                    active
                      ? "text-indigo-700 dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </nav>
  );
}

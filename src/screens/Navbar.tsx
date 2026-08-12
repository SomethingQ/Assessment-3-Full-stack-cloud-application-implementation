import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/wordsearch", label: "Word Search" },
  { to: "/wordle", label: "Wordle" },
  { to: "/about", label: "About" },
  { to: "/settings", label: "Settings" },
];

const kebabIcon = new URL("../assets/kebab-icon.png", import.meta.url).href;

function Navbar() {
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
          className="rounded-md p-2 hover:cursor-pointer bg-white hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
        >
          <img src={kebabIcon} alt="" className="h-5 w-5" />
        </button>

        <div className="hidden gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium ${
                  isActive
                    ? "text-indigo-700 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-slate-200 px-6 py-3 md:hidden dark:border-slate-700">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `rounded-md px-2 py-1 text-sm font-medium ${
                    isActive
                      ? "text-indigo-700 dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}

export default Navbar;

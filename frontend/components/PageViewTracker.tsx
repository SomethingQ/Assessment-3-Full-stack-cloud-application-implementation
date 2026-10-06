"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { reportPageView } from "@/lib/api";

function getSessionId(): string {
  if (typeof window === "undefined") return "unknown";
  let id = window.sessionStorage.getItem("pab-session-id");
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem("pab-session-id", id);
  }
  return id;
}

// Reports how long a visitor spent on each page. This feeds the dashboard's
// "average time on page" metric. Runs when the route changes and when the
// tab is hidden/closed, using keepalive fetches so the beacon is not dropped.
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const start = Date.now();
    const sessionId = getSessionId();
    let sent = false;

    const send = () => {
      if (sent) return;
      sent = true;
      const durationMs = Date.now() - start;
      if (durationMs < 500) return;
      reportPageView({ path: pathname, sessionId, durationMs }).catch(() => {
        // Never surface telemetry failures to the user.
      });
    };

    const onPageHide = () => send();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      send();
    };
  }, [pathname]);

  return null;
}

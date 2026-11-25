"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

const DISMISSED_KEY = "pa_pwa_prompt_dismissed_v1";

function subscribeToPwaState() {
  return () => {};
}

function getPwaPromptAvailability() {
  if (typeof window === "undefined") {
    return false;
  }

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (standalone) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) !== "true";
  } catch {
    return true;
  }
}

function getIsIosSafari() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(userAgent) &&
    /safari/i.test(userAgent) &&
    !/crios|fxios|edgios|opios/i.test(userAgent)
  );
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const isAvailable = useSyncExternalStore(
    subscribeToPwaState,
    getPwaPromptAvailability,
    () => false
  );
  const showIosHint = isAvailable && !installPrompt && getIsIosSafari();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.error("Service worker registration failed:", error);
      });
    }

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissPrompt = () => {
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch (error) {
      console.warn("Could not save the PWA prompt dismissal state:", error);
    }
    setIsDismissed(true);
  };

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      setIsDismissed(true);
    } catch (error) {
      console.error("Could not show the PWA installation prompt:", error);
      setInstallPrompt(null);
      setIsDismissed(true);
    }
  };

  if (isDismissed || (!installPrompt && !showIosHint)) {
    return null;
  }

  return (
    <aside className="fixed bottom-20 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 text-white shadow-2xl sm:bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <Smartphone className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold">
            {installPrompt ? "Install PropertyAccess App" : "Add to Home Screen"}
          </h2>
          {installPrompt ? (
            <p className="mt-1 text-xs text-slate-300">
              Quick access to direct caretaker and landlord listings.
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
              Tap <Share className="h-3.5 w-3.5 text-emerald-400" aria-label="Share" />{" "}
              then choose &quot;Add to Home Screen&quot;.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismissPrompt}
          aria-label="Dismiss install prompt"
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {installPrompt && (
        <button
          type="button"
          onClick={installApp}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Install
        </button>
      )}
    </aside>
  );
}

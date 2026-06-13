"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function PwaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(() => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    });
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setShowInstallBanner(false);
  }, []);

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-600/90 text-black text-xs tracking-widest text-center py-1 font-bold">
          OFFLINE — Some features may be unavailable
        </div>
      )}
      {showInstallBanner && isHome && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3">
          <button
            onClick={handleInstall}
            className="text-[10px] tracking-[0.25em] text-white/30 hover:text-white/70 transition-colors uppercase"
          >
            install app
          </button>
          <button
            onClick={dismissBanner}
            className="text-[10px] tracking-[0.25em] text-white/15 hover:text-white/40 transition-colors uppercase"
          >
            ×
          </button>
        </div>
      )}
      {children}
    </>
  );
}
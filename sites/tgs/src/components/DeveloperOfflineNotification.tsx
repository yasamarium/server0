import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function DeveloperOfflineNotification() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("dev_offline_notice_dismissed");
      if (dismissed === "true") {
        setIsOpen(false);
      }
    } catch {}
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem("dev_offline_notice_dismissed", "true");
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Developer Offline Notice"
      className="relative z-50 w-full bg-zinc-950/95 border-b border-white/10 shadow-lg backdrop-blur-xl transition-all duration-300 select-none"
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-white">
        {/* Left Status & Message */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Pulsing Status Dot */}
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>

          {/* Badge */}
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-[10.5px] uppercase tracking-wider shrink-0">
            Developer Offline
          </span>

          {/* Notice Text */}
          <p className="text-xs sm:text-[13px] text-zinc-300 font-medium truncate">
            Developer is currently offline. Further updates are temporarily on hold.
          </p>
        </div>

        {/* Right Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="size-6 sm:size-7 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </aside>
  );
}

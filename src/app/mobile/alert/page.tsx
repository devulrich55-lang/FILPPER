"use client";

import { useState, useEffect } from "react";
import { Bell, Volume2 } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/MobileNav";

export default function AlertPage() {
  const [ringing, setRinging] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!ringing) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [ringing]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const toggleRing = () => {
    if (ringing) {
      setRinging(false);
      setSeconds(0);
    } else {
      setRinging(true);
      setSeconds(0);
    }
  };

  return (
    <MobileShell>
      <MobileHeader
        title="Alerte sonore"
        subtitle="Faire sonner l'appareil à distance"
      />

      <div className="flex flex-col items-center justify-center px-5 mt-12">
        {/* Bell with sound waves */}
        <div className="relative mb-8">
          {ringing &&
            [1, 2, 3].map((wave) => (
              <div
                key={wave}
                className="absolute inset-0 border-2 border-accent-orange/30 rounded-full animate-pulse-ring"
                style={{
                  animationDelay: `${wave * 0.4}s`,
                  inset: `-${wave * 20}px`,
                }}
              />
            ))}
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center ${
              ringing
                ? "bg-accent-orange/20 border-2 border-accent-orange/50"
                : "bg-bg-elevated border border-white/10"
            }`}
          >
            <Bell
              size={48}
              className={ringing ? "text-accent-orange animate-pulse" : "text-gray-400"}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="text-4xl font-mono font-bold tracking-wider mb-2">
          {formatTime(seconds)}
        </div>
        <p className="text-sm text-gray-400 mb-8">
          {ringing ? "Sonnerie en cours..." : "Appuyez pour démarrer"}
        </p>

        {/* Volume indicator */}
        {ringing && (
          <div className="flex items-center gap-2 mb-8">
            <Volume2 size={16} className="text-accent-orange" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-accent-orange rounded-full animate-pulse"
                  style={{
                    height: `${12 + Math.random() * 20}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={toggleRing}
          className={ringing ? "btn-secondary w-full" : "btn-warning w-full"}
        >
          {ringing ? "Arrêter la sonnerie" : "Démarrer la sonnerie"}
        </button>
      </div>
    </MobileShell>
  );
}

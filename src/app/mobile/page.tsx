import Link from "next/link";
import { MapPin, Signal, ChevronRight } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/MobileNav";
import { devices } from "@/lib/data";

export default function MobileHomePage() {
  return (
    <MobileShell>
      <MobileHeader
        title="Appareils détectés"
        subtitle="4 appareils à proximité"
      />

      {/* Map placeholder */}
      <div className="mx-5 mb-6">
        <div className="card relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-bg-elevated to-bg-secondary">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute border border-white/10 rounded-full"
                  style={{
                    width: `${(i + 1) * 40}px`,
                    height: `${(i + 1) * 40}px`,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-4 h-4 bg-accent-blue rounded-full shadow-glow" />
                <div className="absolute inset-0 w-4 h-4 bg-accent-blue/30 rounded-full animate-pulse-ring" />
              </div>
            </div>
            <MapPin
              size={16}
              className="absolute top-[30%] left-[60%] text-accent-green"
            />
            <MapPin
              size={16}
              className="absolute top-[55%] left-[35%] text-accent-orange"
            />
            <MapPin
              size={16}
              className="absolute top-[40%] left-[75%] text-accent-red"
            />
          </div>
          <div className="absolute bottom-3 left-3 glass rounded-lg px-3 py-1.5 text-xs">
            <span className="text-accent-green font-semibold">● Live</span>
            <span className="text-gray-400 ml-2">Scan actif</span>
          </div>
        </div>
      </div>

      {/* Device list */}
      <div className="px-5 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Appareils détectés
          </h2>
          <Link
            href="/mobile/scan"
            className="text-xs text-accent-blue font-medium"
          >
            Scan avancé →
          </Link>
        </div>

        {devices.map((device) => (
          <Link
            key={device.id}
            href={`/mobile/control?id=${device.id}`}
            className="card flex items-center gap-4 p-4 hover:bg-bg-elevated transition-colors"
          >
            <div className="text-2xl">{device.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{device.name}</p>
                <span
                  className={`w-2 h-2 rounded-full ${
                    device.status === "online"
                      ? "bg-accent-green"
                      : "bg-gray-500"
                  }`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{device.type}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Signal size={12} />
                <span>{device.signal}%</span>
              </div>
              <p className="text-xs text-accent-blue mt-0.5">
                {device.distance}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="px-5 mt-6 grid grid-cols-2 gap-3">
        <Link href="/mobile/offline" className="card p-4 text-center hover:bg-bg-elevated transition-colors">
          <p className="text-sm font-semibold">Mode hors ligne</p>
          <p className="text-xs text-gray-400 mt-1">Stratégies de secours</p>
        </Link>
        <Link href="/mobile/alert" className="card p-4 text-center hover:bg-bg-elevated transition-colors">
          <p className="text-sm font-semibold">Alerte sonore</p>
          <p className="text-xs text-gray-400 mt-1">Faire sonner</p>
        </Link>
      </div>
    </MobileShell>
  );
}

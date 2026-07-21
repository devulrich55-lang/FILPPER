import { Globe, Wifi, MapPin, Radio } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/MobileNav";
import { offlineStrategies } from "@/lib/data";

const strategyIcons = [Globe, Radio, MapPin, Wifi];

export default function OfflinePage() {
  return (
    <MobileShell>
      <MobileHeader
        title="Mode hors ligne"
        subtitle="Stratégies de localisation de secours"
      />

      {/* 3D Globe placeholder */}
      <div className="flex justify-center my-6">
        <div className="relative w-48 h-48">
          <div className="absolute inset-0 rounded-full border-2 border-accent-blue/20 bg-gradient-to-br from-bg-elevated to-bg-secondary">
            <div className="absolute inset-4 rounded-full border border-white/5" />
            <div className="absolute inset-8 rounded-full border border-white/5" />
            <div className="absolute inset-12 rounded-full border border-white/5" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
            <Globe
              size={40}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-blue/60"
            />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 glass rounded-full px-3 py-1 text-xs text-accent-orange font-medium">
            Appareil déconnecté
          </div>
        </div>
      </div>

      {/* Strategies */}
      <div className="px-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Stratégies utilisées
        </h2>
        {offlineStrategies.map((strategy, i) => {
          const Icon = strategyIcons[i] || Globe;
          return (
            <div key={strategy.name} className="card flex items-start gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-accent-blue" />
              </div>
              <div>
                <p className="font-semibold text-sm">{strategy.name}</p>
                <p className="text-xs text-gray-400 mt-1">{strategy.desc}</p>
              </div>
              <span className="ml-auto text-xs text-accent-green font-medium shrink-0">
                Actif
              </span>
            </div>
          );
        })}
      </div>

      {/* Last known location */}
      <div className="mx-5 mt-6 card p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Dernière position connue
        </p>
        <p className="text-sm mt-2 font-medium">Paris, France</p>
        <p className="text-xs text-gray-400 mt-1">
          48.8566° N, 2.3522° E · Il y a 2h
        </p>
      </div>
    </MobileShell>
  );
}

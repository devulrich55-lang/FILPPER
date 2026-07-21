"use client";

import { useState } from "react";
import { Check, Radio } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/MobileNav";
import { scanTechnologies } from "@/lib/data";

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setScanning(false);
          return 100;
        }
        return p + 2;
      });
    }, 60);
  };

  return (
    <MobileShell>
      <MobileHeader
        title="Scan avancé"
        subtitle="Analyse multi-technologie"
      />

      {/* Radar animation */}
      <div className="flex justify-center my-8">
        <div className="relative w-56 h-56">
          {[1, 2, 3, 4].map((ring) => (
            <div
              key={ring}
              className="absolute inset-0 border border-accent-blue/20 rounded-full"
              style={{
                inset: `${ring * 12}px`,
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-1 h-28 bg-gradient-to-t from-accent-blue/80 to-transparent origin-bottom absolute bottom-1/2 ${
                scanning ? "animate-radar" : ""
              }`}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-accent-blue/20 flex items-center justify-center border border-accent-blue/40">
              <Radio
                size={28}
                className={`text-accent-blue ${scanning ? "animate-pulse" : ""}`}
              />
            </div>
          </div>
          {scanning && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm font-mono text-accent-blue">
              {progress}%
            </div>
          )}
        </div>
      </div>

      {/* Technologies checklist */}
      <div className="px-5 space-y-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Technologies de scan
        </h2>
        {scanTechnologies.map((tech) => (
          <div
            key={tech.name}
            className="card flex items-center gap-3 p-3.5"
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                tech.active
                  ? "bg-accent-green/20 text-accent-green"
                  : "bg-gray-700/50 text-gray-500"
              }`}
            >
              {tech.active && <Check size={14} />}
            </div>
            <span
              className={`text-sm ${
                tech.active ? "text-white" : "text-gray-500"
              }`}
            >
              {tech.name}
            </span>
            {tech.active && (
              <span className="ml-auto text-xs text-accent-green font-medium">
                Actif
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Scan button */}
      <div className="px-5 mt-8">
        <button
          onClick={startScan}
          disabled={scanning}
          className="btn-primary w-full text-center disabled:opacity-50"
        >
          {scanning ? "Analyse en cours..." : "Analyser l'environnement"}
        </button>
      </div>
    </MobileShell>
  );
}

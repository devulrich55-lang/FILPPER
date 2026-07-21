"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Bell, Trash2, MessageSquare, ArrowLeft } from "lucide-react";
import { MobileShell } from "@/components/MobileNav";
import { devices } from "@/lib/data";
import { Suspense } from "react";

function ControlContent() {
  const searchParams = useSearchParams();
  const deviceId = Number(searchParams.get("id")) || 1;
  const device = devices.find((d) => d.id === deviceId) || devices[0];

  return (
    <>
      <header className="px-5 pt-12 pb-4">
        <Link
          href="/mobile"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
        <p className="text-xs text-accent-blue font-semibold uppercase tracking-wider">
          Flliter Mobile
        </p>
        <h1 className="text-2xl font-bold mt-1">Contrôle à distance</h1>
        <p className="text-sm text-gray-400 mt-1">{device.name}</p>
      </header>

      {/* Device shield */}
      <div className="flex justify-center my-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-accent-blue/10 border-2 border-accent-blue/30 flex items-center justify-center">
            <Shield size={56} className="text-accent-blue" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 glass rounded-full px-3 py-1 text-xs font-medium">
            {device.status === "online" ? (
              <span className="text-accent-green">● En ligne</span>
            ) : (
              <span className="text-gray-400">● Hors ligne</span>
            )}
          </div>
        </div>
      </div>

      {/* Device info */}
      <div className="mx-5 card p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{device.icon}</span>
          <div>
            <p className="font-semibold">{device.name}</p>
            <p className="text-xs text-gray-400">
              {device.type} · Signal {device.signal}% · {device.distance}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 space-y-3">
        <Link href="/mobile/lock" className="btn-primary w-full flex items-center justify-center gap-3">
          <Shield size={20} />
          Verrouiller
        </Link>
        <Link href="/mobile/alert" className="btn-warning w-full flex items-center justify-center gap-3">
          <Bell size={20} />
          Faire sonner
        </Link>
        <button className="btn-danger w-full flex items-center justify-center gap-3">
          <Trash2 size={20} />
          Effacer les données
        </button>
        <button className="btn-secondary w-full flex items-center justify-center gap-3">
          <MessageSquare size={20} />
          Afficher un message
        </button>
      </div>
    </>
  );
}

export default function ControlPage() {
  return (
    <MobileShell>
      <Suspense fallback={<div className="p-5 text-gray-400">Chargement...</div>}>
        <ControlContent />
      </Suspense>
    </MobileShell>
  );
}

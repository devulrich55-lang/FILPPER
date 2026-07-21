"use client";

import { useState } from "react";
import { Shield, Lock } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/MobileNav";

export default function LockPage() {
  const [message, setMessage] = useState(
    "Cet appareil a été verrouillé. Contactez le propriétaire."
  );
  const [sent, setSent] = useState(false);

  const handleLock = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <MobileShell>
      <MobileHeader
        title="Verrouillage à distance"
        subtitle="Envoyer une commande de verrouillage"
      />

      <div className="flex justify-center my-8">
        <div className="w-24 h-24 rounded-full bg-accent-blue/10 border-2 border-accent-blue/30 flex items-center justify-center">
          <Lock size={40} className="text-accent-blue" />
        </div>
      </div>

      <div className="px-5 space-y-6">
        <div>
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Message à afficher sur l&apos;appareil
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-3 w-full card p-4 text-sm bg-bg-card text-white resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            placeholder="Entrez un message personnalisé..."
          />
        </div>

        <div className="card p-4 space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Options de verrouillage
          </p>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="accent-accent-blue" />
            Verrouiller l&apos;écran immédiatement
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="accent-accent-blue" />
            Désactiver le toucher
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="accent-accent-blue" />
            Effacer les données après 3 tentatives
          </label>
        </div>

        <button
          onClick={handleLock}
          className="btn-primary w-full flex items-center justify-center gap-3"
        >
          <Shield size={20} />
          {sent ? "Commande envoyée ✓" : "Verrouiller l'appareil"}
        </button>

        {sent && (
          <p className="text-center text-sm text-accent-green">
            Commande de verrouillage envoyée avec succès
          </p>
        )}
      </div>
    </MobileShell>
  );
}

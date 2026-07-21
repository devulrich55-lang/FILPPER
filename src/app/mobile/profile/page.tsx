import { User, Shield, Bell, Settings, HelpCircle, LogOut } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/MobileNav";

const menuItems = [
  { icon: Shield, label: "Sécurité", desc: "Authentification et permissions" },
  { icon: Bell, label: "Notifications", desc: "Alertes et sonneries" },
  { icon: Settings, label: "Paramètres", desc: "Configuration de l'app" },
  { icon: HelpCircle, label: "Aide", desc: "Support et FAQ" },
];

export default function ProfilePage() {
  return (
    <MobileShell>
      <MobileHeader title="Profil" subtitle="Gérez votre compte" />

      {/* Avatar */}
      <div className="flex flex-col items-center px-5 mt-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-accent-blue/20 border-2 border-accent-blue/40 flex items-center justify-center">
          <User size={36} className="text-accent-blue" />
        </div>
        <h2 className="text-lg font-bold mt-3">Utilisateur Flliter</h2>
        <p className="text-sm text-gray-400">user@flliter.mobile</p>
        <div className="flex gap-4 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-accent-blue">4</p>
            <p className="text-xs text-gray-400">Appareils</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-accent-green">89%</p>
            <p className="text-xs text-gray-400">Sécurité</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-accent-orange">12</p>
            <p className="text-xs text-gray-400">Alertes</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-5 space-y-2">
        {menuItems.map(({ icon: Icon, label, desc }) => (
          <button
            key={label}
            className="card w-full flex items-center gap-4 p-4 hover:bg-bg-elevated transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center">
              <Icon size={20} className="text-accent-blue" />
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </button>
        ))}

        <button className="card w-full flex items-center gap-4 p-4 hover:bg-accent-red/10 transition-colors text-left mt-4">
          <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center">
            <LogOut size={20} className="text-accent-red" />
          </div>
          <p className="font-semibold text-sm text-accent-red">Déconnexion</p>
        </button>
      </div>
    </MobileShell>
  );
}

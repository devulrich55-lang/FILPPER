import { Clock, Shield, Bell, Trash2, MapPin } from "lucide-react";
import { MobileShell, MobileHeader } from "@/components/MobileNav";
import { recentActivity } from "@/lib/data";

const actionIcons: Record<string, typeof Clock> = {
  detect: MapPin,
  lock: Shield,
  offline: Clock,
  alert: Bell,
  wipe: Trash2,
};

const actionColors: Record<string, string> = {
  detect: "text-accent-green bg-accent-green/10",
  lock: "text-accent-blue bg-accent-blue/10",
  offline: "text-gray-400 bg-gray-700/30",
  alert: "text-accent-orange bg-accent-orange/10",
  wipe: "text-accent-red bg-accent-red/10",
};

export default function HistoryPage() {
  return (
    <MobileShell>
      <MobileHeader
        title="Historique"
        subtitle="Activité récente de vos appareils"
      />

      <div className="px-5 space-y-3 mt-2">
        {recentActivity.map((item, i) => {
          const Icon = actionIcons[item.type] || Clock;
          const colorClass = actionColors[item.type] || "text-gray-400 bg-gray-700/30";

          return (
            <div key={i} className="card flex items-center gap-4 p-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.device}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.action}</p>
              </div>
              <span className="text-xs text-gray-500 shrink-0">{item.time}</span>
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}

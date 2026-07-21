import Link from "next/link";
import {
  LayoutDashboard,
  Smartphone,
  Users,
  FileText,
  Bell,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { dashboardStats, recentActivity, chartData } from "@/lib/data";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: Smartphone, label: "Appareils", href: "/dashboard/devices" },
  { icon: Users, label: "Utilisateurs", href: "/dashboard/users" },
  { icon: FileText, label: "Rapports", href: "/dashboard/reports" },
  { icon: Bell, label: "Alertes", href: "/dashboard/alerts" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
];

export default function DashboardPage() {
  const maxDetection = Math.max(...chartData.map((d) => d.detections));

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-secondary border-r border-white/10 hidden lg:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <p className="text-xs text-accent-blue font-semibold uppercase tracking-wider">
            Flliter Mobile
          </p>
          <h1 className="text-lg font-bold mt-1">Admin Dashboard</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(({ icon: Icon, label, href, active }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-blue/10 text-accent-blue"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link
            href="/mobile"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Retour mobile
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="text-xs text-accent-blue font-semibold">Flliter Mobile</p>
            <h1 className="text-lg font-bold">Dashboard</h1>
          </div>
          <Link href="/mobile" className="text-sm text-gray-400">
            ← Mobile
          </Link>
        </header>

        <div className="p-6 lg:p-8 space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat) => (
              <div key={stat.label} className="card p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl lg:text-3xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-accent-green mt-1">{stat.change}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map placeholder */}
            <div className="lg:col-span-2 card p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Carte mondiale
              </h2>
              <div className="relative h-64 bg-gradient-to-br from-bg-elevated to-bg-secondary rounded-xl overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute border border-white/20 rounded-full"
                      style={{
                        width: `${(i + 1) * 60}px`,
                        height: `${(i + 1) * 60}px`,
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
                </div>
                {[
                  { top: "30%", left: "45%", color: "bg-accent-green" },
                  { top: "50%", left: "60%", color: "bg-accent-blue" },
                  { top: "40%", left: "25%", color: "bg-accent-orange" },
                  { top: "65%", left: "70%", color: "bg-accent-red" },
                ].map((dot, i) => (
                  <div
                    key={i}
                    className={`absolute w-3 h-3 ${dot.color} rounded-full shadow-glow`}
                    style={{ top: dot.top, left: dot.left }}
                  />
                ))}
              </div>
            </div>

            {/* AI Security gauge */}
            <div className="card p-5 flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 self-start">
                Sécurité IA
              </h2>
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-bg-elevated"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${92 * 2.64} ${100 * 2.64}`}
                    strokeLinecap="round"
                    className="text-accent-green"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">92%</span>
                  <span className="text-xs text-gray-400">Santé</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 card p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Statistiques hebdomadaires
              </h2>
              <div className="flex items-end gap-3 h-48">
                {chartData.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col gap-1 items-center flex-1 justify-end">
                      <div
                        className="w-full max-w-[32px] bg-accent-blue/80 rounded-t-md"
                        style={{ height: `${(d.detections / maxDetection) * 100}%` }}
                      />
                      <div
                        className="w-full max-w-[32px] bg-accent-green/60 rounded-t-md"
                        style={{ height: `${(d.recoveries / maxDetection) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-accent-blue/80 rounded" /> Détections
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-accent-green/60 rounded" /> Récupérations
                </span>
              </div>
            </div>

            {/* Activity feed */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Activité récente
              </h2>
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-blue mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{item.device}</p>
                      <p className="text-xs text-gray-400">
                        {item.action} · {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

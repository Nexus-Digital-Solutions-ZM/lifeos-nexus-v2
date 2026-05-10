"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useWebSocket } from "@/hooks/use-websocket";
import toast from "react-hot-toast";

const NAV = [
  {
    href: "/dashboard",
    label: "Command",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: "/projects",
    label: "Projects",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: "/personnel",
    label: "People",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/followups",
    label: "Follow-Ups",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    href: "/reminders",
    label: "Reminders",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  // Real-time WS events → toast notifications
  useWebSocket({
    "project:created": (d: any) => toast.success(`New project: ${d.name}`),
    "project:updated": (d: any) => toast(`Project updated: ${d.name}`, { icon: "✏️" }),
    "followup:created": (d: any) => toast(`New follow-up added`, { icon: "📌" }),
    "followup:updated": (d: any) => {
      if (d.done) toast.success(`Follow-up completed ✓`);
    },
    "personnel:created": (d: any) => toast(`${d.full_name} added to team`, { icon: "👤" }),
  });

  if (!isAuthenticated) return null;

  const activeSegment = "/" + (pathname?.split("/")[1] || "dashboard");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-56 bg-[#080A0F] border-r border-subtle flex flex-col z-50">
        {/* Logo */}
        <div className="px-6 py-7">
          <div className="flex items-center gap-2.5 mb-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C49E52" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
            <span className="font-mono text-gold font-bold tracking-widest text-sm">LIFEOS</span>
          </div>
          <p className="text-base-400 text-[10px] font-mono">Nexus Digital Solutions</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-gold/10 text-gold font-semibold"
                    : "text-base-500 hover:text-base-700 hover:bg-base-100"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-subtle p-4">
          <div className="text-base-600 text-xs mb-3 truncate">{user?.full_name || user?.email}</div>
          <button
            onClick={logout}
            className="text-base-400 text-xs font-mono hover:text-accent-red transition-colors flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
          <div className="text-base-300 text-[9px] font-mono mt-3">PACRA: 320261069474</div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 min-h-screen p-10 animate-fade-in">
        {children}
      </main>
    </div>
  );
}

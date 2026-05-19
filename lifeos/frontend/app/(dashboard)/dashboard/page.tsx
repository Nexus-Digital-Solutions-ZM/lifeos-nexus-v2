"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import type { Project, FollowUp, Briefing, FollowUpStats } from "@/types";
import { StatCard, Badge, SectionLabel } from "@/components/ui";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const today = format(new Date(), "EEEE, dd MMMM yyyy");

  useEffect(() => {
    const load = async () => {
      const [pRes, fRes, sRes] = await Promise.all([
        api.get("/projects/").catch(() => ({ data: [] })),
        api.get("/followups/?done=false").catch(() => ({ data: [] })),
        api.get("/followups/stats/summary").catch(() => ({ data: null })),
      ]);
      setProjects(Array.isArray(pRes.data) ? pRes.data : []);
      setFollowups(Array.isArray(fRes.data) ? fRes.data : []);
      setStats(sRes.data);
    };
    load();
  }, []);

  const fetchBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await api.post("/briefing/", {});
      setBriefing(res.data);
    } finally {
      setBriefingLoading(false);
    }
  };

  const urgent = followups.filter(f => ["critical", "urgent"].includes(f.priority));
  const critical = projects.filter(p => p.urgency === "critical");

  return (
    <div className="max-w-6xl">
      {/* Morning header */}
      <div className="relative bg-gradient-to-br from-[#0D1117] via-[#1A1020] to-[#0D1117] border border-subtle rounded-2xl p-8 mb-7 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="text-gold text-[10px] font-mono uppercase tracking-[0.2em] mb-2">
          Morning Briefing — {today}
        </div>
        <h2 className="font-display text-3xl text-base-800 italic mb-6">
          Good morning, {user?.full_name?.split(" ")[0] || "Boss"}.
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Active Projects" value={projects.filter(p => p.status === "active").length} sub={`${critical.length} critical`} color="#4ECDC4" />
          <StatCard label="Open Follow-Ups" value={stats?.open ?? followups.length} sub={`${stats?.urgent ?? urgent.length} urgent`} color="#FF6B6B" />
          <StatCard label="Overdue" value={stats?.overdue ?? 0} sub="need attention" color="#FF2D55" />
          <StatCard label="Total Projects" value={projects.length} sub="across all ops" color="#C49E52" />
        </div>

        {/* AI Briefing */}
        {!briefing ? (
          <button
            onClick={fetchBriefing}
            disabled={briefingLoading}
            className="flex items-center gap-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-sm font-mono px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            {briefingLoading ? (
              <><span className="animate-spin">⟳</span> Generating AI briefing...</>
            ) : (
              <><span>✦</span> Generate AI Morning Briefing</>
            )}
          </button>
        ) : (
          <div className="bg-black/20 border border-gold/20 rounded-xl p-5">
            <div className="text-gold text-[10px] font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>✦</span> AI BRIEFING — {format(new Date(briefing.generated_at), "HH:mm")}
              <button onClick={() => setBriefing(null)} className="ml-auto text-base-400 hover:text-base-500 text-xs">✕ dismiss</button>
            </div>
            <div className="text-base-700 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{briefing.briefing}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Urgent Today */}
        <div className="bg-surface border border-subtle rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse-dot" />
            <span className="font-display text-base-800 text-base">🔥 Urgent Today</span>
            <span className="ml-auto font-mono text-xs text-base-500">{urgent.length} items</span>
          </div>
          {urgent.length === 0 ? (
            <p className="text-base-400 text-sm font-mono">All clear — no urgent items.</p>
          ) : (
            <div className="space-y-2.5">
              {urgent.slice(0, 6).map(f => (
                <div key={f.id} className="flex items-start gap-3 p-3 bg-accent-red/5 border-l-2 border-accent-red rounded-r-lg">
                  <Badge level={f.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base-800 text-sm leading-snug">{f.item}</p>
                    <p className="text-base-400 text-xs font-mono mt-1">→ {f.owner || "Unassigned"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Pulse */}
        <div className="bg-surface border border-subtle rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse-dot" />
            <span className="font-display text-base-800 text-base">⚡ Project Pulse</span>
          </div>
          <div className="space-y-0 divide-y divide-base-200">
            {projects.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color || "#4ECDC4", boxShadow: `0 0 6px ${p.color}60` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-base-800 text-sm truncate">{p.name}</p>
                  <p className="text-base-400 text-xs font-mono">{p.owner || "TBD"}</p>
                </div>
                <Badge level={p.urgency} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Follow-Ups */}
      {followups.length > 0 && (
        <div className="mt-6 bg-surface border border-subtle rounded-2xl p-6">
          <SectionLabel>All Pending Follow-Ups ({followups.length})</SectionLabel>
          <div className="grid gap-2.5">
            {followups.map(f => (
              <div key={f.id} className="flex items-start gap-3 p-3.5 bg-surface-2 border border-subtle rounded-xl">
                <Badge level={f.priority} />
                <div className="flex-1">
                  <p className="text-base-800 text-sm">{f.item}</p>
                  <p className="text-base-400 text-xs font-mono mt-1">
                    {f.owner} {f.due_date && `· Due ${f.due_date}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

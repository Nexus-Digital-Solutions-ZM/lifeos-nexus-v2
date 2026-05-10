"use client";
import { ReactNode } from "react";
import { clsx } from "clsx";

// ── Badge ─────────────────────────────────────────────────────────────────────
const URGENCY_STYLES: Record<string, string> = {
  critical: "bg-accent-red text-white",
  urgent:   "bg-[#FF6B00] text-white",
  high:     "bg-accent-amber text-black",
  medium:   "bg-[#1A6BFF] text-white",
  low:      "bg-base-300 text-base-500",
  pending:  "bg-base-200 text-base-400",
};

export function Badge({ level, label }: { level: string; label?: string }) {
  return (
    <span className={clsx(
      "text-[10px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded",
      URGENCY_STYLES[level] || URGENCY_STYLES.low
    )}>
      {label || level}
    </span>
  );
}

// ── Status Dot ────────────────────────────────────────────────────────────────
const DOT_STYLES: Record<string, string> = {
  active:   "bg-accent-green",
  pending:  "bg-accent-amber",
  blocked:  "bg-accent-red",
  done:     "bg-base-500",
  inactive: "bg-base-400",
  onboarding: "bg-[#06B6D4]",
};

export function StatusDot({ status }: { status: string }) {
  return (
    <span className={clsx("inline-block w-2 h-2 rounded-full", DOT_STYLES[status] || "bg-base-500")} />
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "md" ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
        variant === "primary" && "bg-gold text-black hover:bg-gold-light",
        variant === "ghost" && "bg-transparent border border-subtle text-base-500 hover:text-base-700 hover:border-base-400",
        variant === "danger" && "bg-transparent border border-subtle text-accent-red hover:bg-accent-red/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div
        className="bg-base-100 border border-subtle rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-6 pb-0">
          <h3 className="font-display text-lg text-base-800">{title}</h3>
          <button onClick={onClose} className="text-base-400 hover:text-base-600 p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-base-500 text-[10px] font-mono uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input + Textarea + Select ──────────────────────────────────────────────────
const inputBase = "w-full bg-base-50 border border-subtle rounded-lg px-3.5 py-2.5 text-base-800 text-sm outline-none focus:border-gold transition-colors placeholder:text-base-400";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputBase} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(inputBase, "resize-y min-h-[80px]")} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(inputBase, "cursor-pointer")} {...props} />;
}

// ── Page Header ────────────────────────────────────────────────────────────────
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="font-display text-2xl text-base-800 italic">{title}</h1>
      {action}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-base-400 text-sm font-mono">{message}</div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-surface-2 rounded-xl p-4 border border-subtle">
      <div className="font-display text-3xl leading-none mb-1.5" style={{ color: color || "#C49E52" }}>{value}</div>
      <div className="text-base-500 text-[10px] font-mono uppercase tracking-widest">{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: color || "#C49E52", opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

// ── Section Label ──────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-base-400 text-[10px] font-mono uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
      <span className="text-base-300">──</span> {children}
    </div>
  );
}

// ── Plus Icon ──────────────────────────────────────────────────────────────────
export function PlusIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

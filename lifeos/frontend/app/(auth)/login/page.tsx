"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C49E52" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
            <span className="font-mono text-gold font-bold tracking-widest text-lg">LIFEOS</span>
          </div>
          <h1 className="font-display text-3xl text-base-800 italic mb-2">Welcome back.</h1>
          <p className="text-base-500 text-sm font-mono">Nexus Digital Solutions</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-subtle rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-base-500 text-xs font-mono uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@nexusdigitalsolutions.zm"
              className="w-full bg-base-50 border border-subtle rounded-lg px-4 py-3 text-base-800 text-sm outline-none focus:border-gold transition-colors placeholder:text-base-400"
            />
          </div>
          <div>
            <label className="block text-base-500 text-xs font-mono uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-base-50 border border-subtle rounded-lg px-4 py-3 text-base-800 text-sm outline-none focus:border-gold transition-colors placeholder:text-base-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-black font-bold py-3 rounded-lg text-sm tracking-wide hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-base-400 text-xs font-mono mt-6">
          CONNECTING THE DOTS.BUILDING THE FUTURE
        </p>
      </div>
    </div>
  );
}

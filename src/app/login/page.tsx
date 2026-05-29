"use client";

import { useState } from "react";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Full reload so the auth provider re-checks the new session cookie.
        window.location.assign("/");
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Sign in failed");
      }
    } catch {
      setError("Couldn't reach the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-terracotta" strokeWidth={2} />
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">
              Outer Sunset
            </h1>
            <p className="font-serif text-lg text-ink-light">
              Neighborhood Gift Bank
            </p>
          </div>
        </div>

        <p className="text-center text-ink-faint text-sm mb-8 leading-relaxed">
          A personal notebook for tracking the gifts, dreams, and passions of your neighbors.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoFocus
            className="w-full bg-cream rounded-xl py-3.5 px-4 text-ink placeholder:text-ink-faint/50 border border-ink/5 text-center"
          />

          {error && (
            <p className="text-sm text-terracotta text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-terracotta text-cream font-medium shadow-[0_2px_8px_rgba(196,105,74,0.3)] active:translate-y-[1px] transition-all disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
            ) : (
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            )}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

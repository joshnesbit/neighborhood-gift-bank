"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: { ok: true } | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  configured: false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ ok: true } | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let canceled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (canceled) return;
        setConfigured(!!data.configured);
        setUser(data.authenticated ? { ok: true } : null);
        setLoading(false);
      })
      .catch(() => {
        if (!canceled) setLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Full reload → proxy redirects to /login now that the cookie is cleared.
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, configured, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

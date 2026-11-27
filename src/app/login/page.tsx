"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getDeviceLabel,
  getOrCreateDeviceId,
  saveSessionToken,
} from "@/lib/device";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (signInError || !authData.user) {
      setError(signInError?.message || "Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: deviceRes, error: rpcError } = await supabase.rpc(
      "authorize_device_session",
      {
        p_device_hash: getOrCreateDeviceId(),
        p_device_label: getDeviceLabel(),
      }
    );

    if (rpcError || !deviceRes?.ok) {
      await supabase.auth.signOut();
      setError(
        deviceRes?.message ||
          rpcError?.message ||
          "This account has reached its 3-device limit for the last 30 days."
      );
      setLoading(false);
      return;
    }

    saveSessionToken(deviceRes.session_token);

        const { data: profile } = await supabase
      .from("profiles")
      .select("role, kyc_status")
      .eq("id", authData.user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/admin");
    } else if (profile?.role === "manager") {
      router.push(profile.kyc_status === "approved" ? "/manager" : "/manager/kyc");
    } else {
      router.push("/");
    }

    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          propertyaccess<span className="text-emerald-brand">.ke</span>
        </Link>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Sign in to access your 7-Day Pass or Manager Hub
        </p>
      </div>

      <div className="rounded-2xl border border-subtle bg-card p-6 shadow-sm">
        <h1 className="text-lg font-bold">Welcome back</h1>

        <form onSubmit={handleLogin} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-subtle bg-canvas py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-brand"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-subtle bg-canvas py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-brand"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-brand py-3 text-sm font-bold text-white transition hover:bg-emerald-hover disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-brand" />
          <span>Signing in logs out any other active phone automatically</span>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-ink-secondary">
        New to propertyaccess.ke?{" "}
        <Link href="/signup" className="font-bold text-emerald-brand hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}

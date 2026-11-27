"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Home,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LegalLinks } from "@/components/legal-links";
import {
  getDeviceLabel,
  getOrCreateDeviceId,
  saveSessionToken,
} from "@/lib/device";

function normalizeKenyanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `+254${digits.slice(1)}`;
  }
  if (digits.startsWith("254") && digits.length === 12) {
    return `+${digits}`;
  }
  return raw.trim();
}

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"tenant" | "manager">("tenant");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const formattedPhone = normalizeKenyanPhone(phone);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone_number: formattedPhone,
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!authData.session) {
      setError(
        "Account created! Check your email to confirm, or disable Confirm Email in Supabase Auth settings."
      );
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
        deviceRes?.message || rpcError?.message || "Device authorization failed."
      );
      setLoading(false);
      return;
    }

    saveSessionToken(deviceRes.session_token);
    router.push(role === "manager" ? "/manager/kyc" : "/");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          propertyaccess<span className="text-emerald-brand">.ke</span>
        </Link>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Direct-to-caretaker homes &amp; land in Kenya. Zero broker fees.
        </p>
      </div>

      <div className="rounded-2xl border border-subtle bg-card p-6 shadow-sm">
        <h1 className="text-lg font-bold">Create your account</h1>

        {/* Role Selector */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("tenant")}
            className={`flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition ${
              role === "tenant"
                ? "border-emerald-brand bg-emerald-brand/10"
                : "border-subtle bg-muted-surface/50 hover:border-ink-muted"
            }`}
          >
            <Home
              className={`h-5 w-5 ${
                role === "tenant" ? "text-emerald-brand" : "text-ink-secondary"
              }`}
            />
            <span className="text-xs font-bold">House Hunter</span>
            <span className="text-[11px] text-ink-secondary">
              Rent, buy or bid directly
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("manager")}
            className={`flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition ${
              role === "manager"
                ? "border-emerald-brand bg-emerald-brand/10"
                : "border-subtle bg-muted-surface/50 hover:border-ink-muted"
            }`}
          >
            <Building2
              className={`h-5 w-5 ${
                role === "manager" ? "text-emerald-brand" : "text-ink-secondary"
              }`}
            />
            <span className="text-xs font-bold">Property Manager</span>
            <span className="text-[11px] text-ink-secondary">
              List verified vacant units
            </span>
          </button>
        </div>

        <form onSubmit={handleSignup} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">
              Full Name (as on National ID)
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. David Mbate"
                className="w-full rounded-xl border border-subtle bg-canvas py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-brand"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-secondary">
              Safaricom / M-Pesa Phone Number
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="w-full rounded-xl border border-subtle bg-canvas py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-brand"
              />
            </div>
          </div>

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
              Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-muted" />
              <input
                type="password"
                required
                minLength={6}
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
            {loading
              ? "Creating account..."
              : role === "manager"
              ? "Continue to Manager KYC"
              : "Create Tenant Account"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-brand" />
          <span>Protected by 1-device active session lock</span>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-emerald-brand hover:underline">
          Sign in
        </Link>
      </p>
      <div className="mt-5">
        <LegalLinks />
      </div>
    </main>
  );
}

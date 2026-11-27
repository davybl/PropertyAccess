"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Copy,
  KeyRound,
  Lock,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearSessionToken, getSessionToken } from "@/lib/device";
import { MpesaUnlockSheet } from "@/components/mpesa-unlock-sheet";
import type { PropertyCategory } from "@/types/property";

export interface RevealedContactData {
  caretaker_name: string;
  caretaker_role: string;
  caretaker_phone: string;
  whatsapp_phone: string;
}

interface CaretakerUnlockCardProps {
  listingId: string;
  listingTitle: string;
  category: PropertyCategory;
  priceKes: number;
  isLoggedIn: boolean;
  hasActiveCategoryPass: boolean;
  initialRevealedContact: RevealedContactData | null;
  revealsUsedToday: number;
}

export function CaretakerUnlockCard({
  listingId,
  listingTitle,
  category,
  priceKes,
  isLoggedIn,
  hasActiveCategoryPass,
  initialRevealedContact,
  revealsUsedToday,
}: CaretakerUnlockCardProps) {
  const router = useRouter();
  const [contact, setContact] = useState<RevealedContactData | null>(
    initialRevealedContact
  );
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpesaSheetOpen, setMpesaSheetOpen] = useState(false);

  const remainingToday = Math.max(0, 7 - revealsUsedToday);

  const handlePrimaryAction = async () => {
    setError(null);

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Open M-Pesa STK Push bottom sheet if user needs a 7-Day Pass
    if (!hasActiveCategoryPass && !contact) {
      setMpesaSheetOpen(true);
      return;
    }

    // User already has an active 7-Day Pass -> call atomic reveal_listing_contact RPC
    setRevealing(true);
    const supabase = createClient();
    const sessionToken = getSessionToken();

    if (!sessionToken) {
      setRevealing(false);
      setError("Device session missing. Please sign in again.");
      return;
    }

    const { data, error: rpcError } = await supabase.rpc(
      "reveal_listing_contact",
      {
        p_listing_id: listingId,
        p_session_token: sessionToken,
      }
    );

    setRevealing(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    if (!data?.ok) {
      if (data?.error === "SESSION_DISPLACED") {
        clearSessionToken();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
        return;
      }
      if (data?.error === "PASS_REQUIRED") {
        setMpesaSheetOpen(true);
        return;
      }
      setError(data?.message || "Could not unlock contact.");
      return;
    }

    setContact({
      caretaker_name: data.caretaker_name,
      caretaker_role: data.caretaker_role,
      caretaker_phone: data.caretaker_phone,
      whatsapp_phone: data.whatsapp_phone,
    });
    router.refresh();
  };

  const handleCopyPhone = async () => {
    if (!contact) return;
    await navigator.clipboard.writeText(contact.caretaker_phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Habari ${contact?.caretaker_name || ""}, I found "${listingTitle}" (KES ${Number(
      priceKes
    ).toLocaleString()}) on propertyaccess.ke. Is it still vacant for viewing?`
  );

  return (
    <>
      <div className="rounded-2xl border border-subtle bg-card p-5 shadow-sm">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-brand/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-brand">
            <BadgeCheck className="h-3.5 w-3.5" />
            Direct Caretaker Vault
          </span>
          <span className="text-[11px] font-bold text-ink-muted">
            0% Broker Fee
          </span>
        </div>

        {/* STATE A: CONTACT UNLOCKED */}
        {contact ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-emerald-brand/30 bg-emerald-brand/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-brand">
                {contact.caretaker_role}
              </p>
              <h3 className="mt-0.5 text-lg font-extrabold text-ink">
                {contact.caretaker_name}
              </h3>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-card px-3 py-2">
                <span className="font-mono text-sm font-extrabold tracking-wide text-ink">
                  {contact.caretaker_phone}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-brand hover:underline"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct Call & WhatsApp Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${contact.caretaker_phone}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-brand py-3 text-xs font-bold text-white transition hover:bg-emerald-hover"
              >
                <Phone className="h-4 w-4" />
                Call Now
              </a>
              <a
                href={`https://wa.me/${contact.whatsapp_phone.replace(
                  /\D/g,
                  ""
                )}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-brand bg-emerald-brand/10 py-3 text-xs font-bold text-emerald-brand transition hover:bg-emerald-brand/20"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>

            <p className="text-center text-[11px] text-ink-muted">
              Re-opening this listing is free while your 7-Day Pass is active.
            </p>
          </div>
        ) : (
          /* STATE B: LOCKED CARETAKER CARD (+254 7XX ••• •••) */
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-subtle bg-canvas p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-secondary">
                    Verified Caretaker / Owner
                  </p>
                  <p className="mt-1 font-mono text-base font-extrabold tracking-wider text-ink">
                    +254 7XX ••• •••
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-surface text-ink-muted">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
            </div>

            {hasActiveCategoryPass ? (
              <div className="rounded-xl border border-emerald-brand/30 bg-emerald-brand/10 p-3 text-xs text-ink">
                <p className="font-bold text-emerald-brand">
                  Your {category.toUpperCase()} 7-Day Pass is active!
                </p>
                <p className="mt-0.5 text-ink-secondary">
                  Tap below to reveal this caretaker&apos;s number ({remainingToday}/7 reveals left today).
                </p>
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-subtle bg-muted-surface/50 p-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-amber-featured" />
                  <span>KES 200 • 7-Day {category.toUpperCase()} Pass</span>
                </div>
                <ul className="space-y-1 text-[11px] text-ink-secondary">
                  <li>• Reveal up to 7 caretaker contacts every 24h for 7 days</li>
                  <li>• Direct Safaricom M-Pesa STK Push (instant receipt)</li>
                  <li>• 24h refund protection if unit was already taken</li>
                </ul>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              disabled={revealing}
              onClick={handlePrimaryAction}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-brand py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-hover disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {revealing
                ? "Unlocking caretaker..."
                : !isLoggedIn
                ? "Sign In to Unlock Contact"
                : hasActiveCategoryPass
                ? "Reveal Caretaker Contact (1 Quota)"
                : "Unlock Contact — KES 200 (7-Day Pass)"}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-brand" />
              <span>Protected by 1-device active session lock</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Fixed Bottom Conversion Bar (code5.html) */}
      {!contact && (
        <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-subtle bg-card/95 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-ink-muted">
                {hasActiveCategoryPass ? "7-Day Pass Active" : "7-Day Category Pass"}
              </p>
              <p className="text-sm font-extrabold text-ink">
                {hasActiveCategoryPass
                  ? `${remainingToday}/7 reveals left`
                  : "KES 200 via M-Pesa"}
              </p>
            </div>
            <button
              type="button"
              disabled={revealing}
              onClick={handlePrimaryAction}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-brand px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-hover disabled:opacity-60"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {revealing
                ? "Unlocking..."
                : hasActiveCategoryPass
                ? "Reveal Number"
                : "Unlock — KES 200"}
            </button>
          </div>
        </div>
      )}

      {/* M-Pesa STK Push Bottom Sheet (code1.html) */}
      <MpesaUnlockSheet
        isOpen={mpesaSheetOpen}
        onClose={() => setMpesaSheetOpen(false)}
        listingId={listingId}
        listingTitle={listingTitle}
        category={category}
        priceKes={priceKes}
        onUnlocked={(revealed) => {
          setContact(revealed);
          router.refresh();
        }}
      />
    </>
  );
}

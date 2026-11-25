"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSessionToken } from "@/lib/device";
import type { PropertyCategory } from "@/types/property";
import type { RevealedContactData } from "@/components/caretaker-unlock-card";

const emptySubscribe = () => () => {};

interface MpesaUnlockSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  category: PropertyCategory;
  priceKes: number;
  onUnlocked: (contact: RevealedContactData) => void;
}

type SheetStage = "form" | "pending" | "unlocked" | "failed";

export function MpesaUnlockSheet({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  category,
  priceKes,
  onUnlocked,
}: MpesaUnlockSheetProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [stage, setStage] = useState<SheetStage>("form");
  const [phoneInput, setPhoneInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unlockedContact, setUnlockedContact] =
    useState<RevealedContactData | null>(null);
  const [copied, setCopied] = useState(false);

  // Pre-fill phone number from user's profile if saved
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const loadProfilePhone = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", user.id)
        .single();

      if (prof?.phone_number && active && !phoneInput) {
        setPhoneInput(prof.phone_number);
      }
    };
    loadProfilePhone();
    return () => {
      active = false;
    };
  }, [isOpen, phoneInput]);

  // Once payment completes, immediately call reveal_listing_contact RPC
  const finalizeReveal = useCallback(
    async (receipt: string | null) => {
      const supabase = createClient();
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setErrorMessage("Device session missing. Please sign in again.");
        setStage("failed");
        return;
      }

      const { data, error } = await supabase.rpc("reveal_listing_contact", {
        p_listing_id: listingId,
        p_session_token: sessionToken,
      });

      if (error || !data?.ok) {
        setErrorMessage(
          data?.message ||
            error?.message ||
            "Pass activated! Refresh the page to view contact."
        );
        setStage("failed");
        return;
      }

      const revealed: RevealedContactData = {
        caretaker_name: data.caretaker_name,
        caretaker_role: data.caretaker_role,
        caretaker_phone: data.caretaker_phone,
        whatsapp_phone: data.whatsapp_phone,
      };

      setReceiptNumber(receipt);
      setUnlockedContact(revealed);
      setStage("unlocked");
      onUnlocked(revealed);
    },
    [listingId, onUnlocked]
  );

  // Listen via Supabase Realtime + fallback poll + 65s timeout while waiting for M-Pesa PIN
  useEffect(() => {
    if (stage !== "pending" || !transactionId) return;

    const supabase = createClient();
    let handled = false;

    const handleStatusRow = (row: {
      status?: string;
      mpesa_receipt_number?: string | null;
      result_desc?: string | null;
    }) => {
      if (handled) return;
      if (row.status === "completed") {
        handled = true;
        finalizeReveal(row.mpesa_receipt_number ?? null);
      } else if (row.status === "failed" || row.status === "cancelled") {
        handled = true;
        setErrorMessage(
          row.result_desc ||
            (row.status === "cancelled"
              ? "M-Pesa prompt was cancelled on your phone."
              : "M-Pesa payment failed. Please try again.")
        );
        setStage("failed");
      }
    };

    const channel = supabase
      .channel(`mpesa-tx-${transactionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mpesa_transactions",
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          handleStatusRow(
            payload.new as {
              status?: string;
              mpesa_receipt_number?: string | null;
              result_desc?: string | null;
            }
          );
        }
      )
      .subscribe();

    const pollInterval = setInterval(async () => {
      if (handled) return;
      const { data } = await supabase
        .from("mpesa_transactions")
        .select("status, mpesa_receipt_number, result_desc")
        .eq("id", transactionId)
        .single();

      if (data) handleStatusRow(data);
    }, 3500);

    const timeoutTimer = setTimeout(() => {
      if (handled) return;
      handled = true;
      setErrorMessage(
        "Confirmation timed out. If you didn't complete the M-Pesa PIN prompt, tap Try Again."
      );
      setStage("failed");
    }, 65000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutTimer);
      supabase.removeChannel(channel);
    };
  }, [stage, transactionId, finalizeReveal]);

  if (!isOpen || !isClient) return null;

  const handleSendStk = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          category,
          phoneNumber: phoneInput,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Could not send M-Pesa prompt.");
        return;
      }

      if (data.alreadyHasPass) {
        await finalizeReveal(null);
        return;
      }

      setTransactionId(data.transactionId);
      setStage("pending");
    } catch {
      setSubmitting(false);
      setErrorMessage("Network error while reaching Safaricom M-Pesa.");
    }
  };

  const handleCopy = async () => {
    if (!unlockedContact) return;
    await navigator.clipboard.writeText(unlockedContact.caretaker_phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappText = encodeURIComponent(
    `Habari ${unlockedContact?.caretaker_name || ""}, I unlocked your contact on propertyaccess.app for "${listingTitle}" (KES ${Number(
      priceKes
    ).toLocaleString()}). When can I come for viewing?`
  );

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-subtle bg-card p-6 pb-8 shadow-2xl sm:rounded-[28px] sm:pb-6">
        {/* Top Badge + Close Button */}
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-brand/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-brand">
            <ShieldCheck className="h-3.5 w-3.5" />
            Lipa na M-Pesa Express
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-surface text-ink-secondary hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* STAGE 1: PHONE INPUT FORM */}
        {stage === "form" && (
          <form onSubmit={handleSendStk} className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-ink">
                Activate 7-Day {category.toUpperCase()} Pass
              </h2>
              <p className="mt-1 text-xs text-ink-secondary">
                Pay <strong className="text-ink">KES 200</strong> once to reveal up to{" "}
                <strong className="text-ink">7 caretaker contacts per day</strong> for 7 days in{" "}
                <span className="capitalize">{category}</span>.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">
                Safaricom M-Pesa Phone Number
              </label>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-emerald-brand" />
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0711431522"
                  className="w-full rounded-xl border border-subtle bg-canvas py-2.5 pl-10 pr-4 font-mono text-sm font-bold text-ink outline-none focus:border-emerald-brand"
                />
              </div>
            </div>

            <div className="rounded-xl border border-subtle bg-muted-surface/60 p-3.5 text-xs">
              <div className="flex items-center justify-between font-bold text-ink">
                <span>7-Day Category Pass</span>
                <span>KES 200</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-brand">
                <span>Broker / Viewing Fees</span>
                <span className="font-bold">KES 0</span>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-brand py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-hover disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending M-Pesa Prompt...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Pay KES 200 via M-Pesa
                </>
              )}
            </button>
          </form>
        )}

        {/* STAGE 2: PENDING PIN ENTRY */}
        {stage === "pending" && (
          <div className="space-y-5 py-3 text-center">
            <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-emerald-brand/15 text-emerald-brand">
              <Smartphone className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-ink">
                Check Your Phone for M-Pesa PIN
              </h2>
              <p className="mt-1.5 text-xs text-ink-secondary">
                We sent an STK Push prompt of{" "}
                <strong className="text-ink">KES 200</strong> to{" "}
                <span className="font-mono font-bold text-ink">
                  {phoneInput}
                </span>
                . Enter your M-Pesa PIN to unlock automatically.
              </p>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted-surface">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-brand" />
            </div>

            <p className="text-[11px] font-semibold text-ink-muted">
              Listening for Safaricom confirmation...
            </p>

            <button
              type="button"
              onClick={() => {
                setTransactionId(null);
                setErrorMessage(null);
                setStage("form");
              }}
              className="text-xs font-bold text-ink-secondary underline hover:text-ink"
            >
              Cancel or change number
            </button>
          </div>
        )}

        {/* STAGE 3: CONTACT UNLOCKED */}
        {stage === "unlocked" && unlockedContact && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-brand/40 bg-emerald-brand/10 p-4">
              <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-brand" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-brand">
                  7-Day Pass Activated!
                </p>
                <p className="text-[11px] text-ink-secondary">
                  {receiptNumber
                    ? `M-Pesa Receipt: ${receiptNumber}`
                    : "Verified M-Pesa Payment Confirmed"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-subtle bg-canvas p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                {unlockedContact.caretaker_role}
              </p>
              <h3 className="mt-0.5 text-lg font-extrabold text-ink">
                {unlockedContact.caretaker_name}
              </h3>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-card px-3.5 py-2.5">
                <span className="font-mono text-sm font-extrabold text-ink">
                  {unlockedContact.caretaker_phone}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
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

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${unlockedContact.caretaker_phone}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-brand py-3 text-xs font-extrabold text-white hover:bg-emerald-hover"
              >
                <Phone className="h-4 w-4" />
                Call Caretaker
              </a>
              <a
                href={`https://wa.me/${unlockedContact.whatsapp_phone.replace(
                  /\D/g,
                  ""
                )}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-brand bg-emerald-brand/10 py-3 text-xs font-extrabold text-emerald-brand hover:bg-emerald-brand/20"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-featured/30 bg-amber-featured/10 p-3 text-xs">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-amber-featured" />
              <div>
                <p className="font-bold text-ink">
                  <Sparkles className="mr-1 inline h-3 w-3 text-amber-featured" />
                  Move-In Perk Unlocked
                </p>
                <p className="mt-0.5 text-[11px] text-ink-secondary">
                  Show your M-Pesa receipt at viewing for priority unit reservation with zero agency commission.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 4: FAILED / CANCELLED */}
        {stage === "failed" && (
          <div className="space-y-4 py-2 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-danger" />
            <div>
              <h2 className="text-base font-extrabold text-ink">
                Payment Not Completed
              </h2>
              <p className="mt-1 text-xs text-ink-secondary">
                {errorMessage || "The M-Pesa request timed out or was cancelled."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStage("form");
              }}
              className="w-full rounded-xl bg-emerald-brand py-3 text-xs font-extrabold text-white hover:bg-emerald-hover"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

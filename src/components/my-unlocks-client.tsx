"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Compass,
  Flag,
  KeyRound,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ActivePassSummary, PropertyCategory } from "@/types/property";

export interface RevealHistoryItem {
  id: string;
  listing_id: string;
  viewing_status: string;
  revealed_at: string;
  listings: {
    id: string;
    title: string;
    unit_tag: string | null;
    category: PropertyCategory;
    price_kes: number;
    neighborhood: string;
    county: string;
  } | null;
}

interface MyUnlocksClientProps {
  activePasses: ActivePassSummary[];
  remainingToday: number;
  initialHistory: RevealHistoryItem[];
}

function formatTimeRemaining(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

function isWithin24Hours(revealedAt: string): boolean {
  return Date.now() - new Date(revealedAt).getTime() <= 24 * 60 * 60 * 1000;
}

export function MyUnlocksClient({
  activePasses,
  remainingToday,
  initialHistory,
}: MyUnlocksClientProps) {
  const [history, setHistory] = useState<RevealHistoryItem[]>(initialHistory);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStatusUpdate = async (
    revealId: string,
    nextStatus: "viewed" | "disputed"
  ) => {
    if (busyId) return;
    setBusyId(revealId);
    setFeedback(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("contact_reveals")
      .update({ viewing_status: nextStatus })
      .eq("id", revealId);

    if (error) {
      setFeedback("Could not update status right now. Please try again.");
      setBusyId(null);
      return;
    }

    setHistory((prev) =>
      prev.map((item) =>
        item.id === revealId ? { ...item, viewing_status: nextStatus } : item
      )
    );

    if (nextStatus === "disputed") {
      setFeedback(
        "Unit flagged for Admin review under 24-hour protection. If confirmed occupied, your reveal credit or pass will be restored."
      );
    }

    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header + Daily Quota Meter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            My Passes &amp; Unlocks
          </h1>
          <p className="mt-0.5 text-xs text-ink-secondary">
            7-Day Category Pass • Up to 7 unique caretaker reveals every 24h
          </p>
        </div>

        <div className="rounded-xl border border-subtle bg-card px-3.5 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            Today&apos;s Reveal Quota
          </p>
          <p className="text-sm font-extrabold text-emerald-brand">
            {remainingToday} of 7 remaining
          </p>
        </div>
      </div>

      {feedback && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-featured/40 bg-amber-featured/10 p-3.5 text-xs text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-featured" />
          <p>{feedback}</p>
        </div>
      )}

      {/* Active 7-Day Category Passes */}
      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-secondary">
          Active 7-Day Category Passes ({activePasses.length})
        </h2>

        {activePasses.length === 0 ? (
          <div className="rounded-2xl border border-subtle bg-card p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-brand/10 text-emerald-brand">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  No active 7-Day Pass
                </h3>
                <p className="mt-1 text-xs text-ink-secondary">
                  Open any listing and pay via M-Pesa STK Push to unlock up to 7 caretaker contacts per day for 7 full days in that category.
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-brand px-4 py-2 text-xs font-bold text-white hover:bg-emerald-hover"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Explore Properties
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activePasses.map((pass) => (
              <div
                key={pass.id}
                className="flex items-center justify-between rounded-2xl border border-emerald-brand/40 bg-emerald-brand/10 p-4"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-brand" />
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-brand">
                      {pass.category} 7-Day Pass
                    </p>
                    <p className="mt-0.5 text-xs text-ink-secondary">
                      Re-viewing unlocked contacts is free
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px] font-bold text-ink">
                  <Clock className="h-3 w-3 text-emerald-brand" />
                  {formatTimeRemaining(pass.expires_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Unlocked Caretaker History + 24h Dispute Protection */}
      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-secondary">
          Unlocked Caretaker Contacts ({history.length})
        </h2>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-subtle bg-card p-8 text-center">
            <p className="text-sm font-bold text-ink">
              No contacts revealed yet
            </p>
            <p className="mt-1 text-xs text-ink-secondary">
              Every caretaker number you unlock appears here so you can call or WhatsApp them again anytime during your pass.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const eligible24h = isWithin24Hours(item.revealed_at);
              const isDisputed =
                item.viewing_status === "disputed" ||
                item.viewing_status === "refund_approved";
              const isViewed = item.viewing_status === "viewed";

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-subtle bg-card p-4 transition hover:border-emerald-brand/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-emerald-brand/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-brand">
                          {item.listings?.category || "Listing"}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${
                            isDisputed
                              ? "bg-danger/10 text-danger"
                              : isViewed
                              ? "bg-emerald-brand/10 text-emerald-brand"
                              : "bg-muted-surface text-ink-secondary"
                          }`}
                        >
                          {item.viewing_status.replaceAll("_", " ")}
                        </span>
                        {eligible24h && !isDisputed && (
                          <span className="text-[10px] font-semibold text-amber-featured">
                            • 24h Refund Protected
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1.5 truncate text-sm font-bold text-ink">
                        {item.listings?.title || "Property Listing"}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-secondary">
                        <MapPin className="h-3 w-3 shrink-0 text-emerald-brand" />
                        {item.listings?.neighborhood}, {item.listings?.county} •
                        KES {Number(item.listings?.price_kes || 0).toLocaleString()}
                      </p>
                    </div>

                    <Link
                      href={`/listings/${item.listing_id}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-brand px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-hover"
                    >
                      Open Contact
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Viewing & 24h Refund Flag Actions */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-3">
                    <span className="text-[11px] text-ink-muted">
                      Unlocked{" "}
                      {new Date(item.revealed_at).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {!isViewed && !isDisputed && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleStatusUpdate(item.id, "viewed")}
                          className="inline-flex items-center gap-1 rounded-lg border border-subtle bg-canvas px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:border-emerald-brand disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-brand" />
                          Mark Visited
                        </button>
                      )}

                      {!isDisputed ? (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleStatusUpdate(item.id, "disputed")}
                          className="inline-flex items-center gap-1 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-[11px] font-semibold text-danger hover:bg-danger/20 disabled:opacity-50"
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Report Occupied / Unreachable
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger">
                          <Flag className="h-3 w-3" />
                          Flagged for Admin Review
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

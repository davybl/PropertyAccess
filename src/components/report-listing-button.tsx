"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const REPORT_REASONS = [
  { value: "broker_agent", label: "Broker or agent posing as caretaker" },
  { value: "already_rented", label: "Already rented or occupied" },
  { value: "wrong_price_info", label: "Incorrect price or listing information" },
  { value: "scam_suspected", label: "Suspected scam" },
  { value: "other", label: "Other" },
] as const;

interface ReportListingButtonProps {
  listingId: string;
}

export function ReportListingButton({ listingId }: ReportListingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError(authError?.message || "Sign in to report this listing.");
      setSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "tenant") {
      setError(profileError?.message || "Only tenant accounts can report listings.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("listing_reports").insert({
      listing_id: listingId,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSubmitted(false);
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-card px-3 py-2 text-xs font-semibold text-ink-secondary transition hover:border-danger hover:text-danger"
      >
        <Flag className="h-3.5 w-3.5" />
        Report Listing
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-canvas/90 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-listing-title"
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-subtle bg-card p-6 pb-8 shadow-2xl sm:rounded-[28px] sm:pb-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="report-listing-title"
                className="text-lg font-extrabold text-ink"
              >
                Report Listing
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close report dialog"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-surface text-ink-secondary hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-subtle bg-canvas p-4 text-sm text-ink-secondary">
                Thank you. Your report has been sent to the moderation team.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="listing-report-reason"
                    className="mb-1.5 block text-xs font-bold text-ink"
                  >
                    What should we review?
                  </label>
                  <select
                    id="listing-report-reason"
                    required
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
                  >
                    <option value="">Select a reason</option>
                    {REPORT_REASONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="listing-report-details"
                    className="mb-1.5 block text-xs font-bold text-ink"
                  >
                    Details (optional)
                  </label>
                  <textarea
                    id="listing-report-details"
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    maxLength={1000}
                    rows={4}
                    className="w-full resize-y rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !reason}
                  className="w-full rounded-xl bg-emerald-brand py-3 text-sm font-bold text-white transition hover:bg-emerald-hover disabled:opacity-60"
                >
                  {submitting ? "Sending report..." : "Send Report"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}

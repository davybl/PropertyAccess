"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Flag,
  Orbit,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";

type PendingManager = {
  id: string;
  full_name: string;
  phone_number: string | null;
  kra_pin: string | null;
  id_doc_url: string | null;
  ownership_doc_url: string | null;
  kyc_status: string;
};

type AdminListing = {
  id: string;
  title: string;
  unit_tag: string | null;
  category: string;
  price_kes: number;
  neighborhood: string;
  county: string;
  status: string;
  is_featured: boolean;
  has_3d_tour: boolean;
};

type DisputedReveal = {
  id: string;
  listing_id: string;
  viewing_status: string;
  revealed_at: string;
  listings: {
    id: string;
    title: string;
    neighborhood: string;
    county: string;
    status: string;
  } | null;
};

type ListingReport = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listings: {
    id: string;
    title: string;
    neighborhood: string;
    county: string;
    status: string;
  } | null;
};

const REPORT_REASON_LABELS: Record<string, string> = {
  broker_agent: "Broker or agent",
  already_rented: "Already rented or occupied",
  wrong_price_info: "Incorrect price or information",
  scam_suspected: "Suspected scam",
  other: "Other",
};

export default function AdminModerationPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "kyc" | "listings" | "disputes" | "reports"
  >("kyc");
  const [managers, setManagers] = useState<PendingManager[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [disputes, setDisputes] = useState<DisputedReveal[]>([]);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [documentPreview, setDocumentPreview] = useState<{
    title: string;
    url: string;
    isPdf: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [documentBusy, setDocumentBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const loadControlRoom = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email ?? null);

      const { data: me } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (me?.role !== "admin") {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      const [pendingRes, listingsRes, disputesRes, reportsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, phone_number, kra_pin, id_doc_url, ownership_doc_url, kyc_status"
          )
          .eq("role", "manager")
          .eq("kyc_status", "pending"),
        supabase
          .from("listings")
          .select(
            "id, title, unit_tag, category, price_kes, neighborhood, county, status, is_featured, has_3d_tour"
          )
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("contact_reveals")
          .select(
            `
            id,
            listing_id,
            viewing_status,
            revealed_at,
            listings (
              id,
              title,
              neighborhood,
              county,
              status
            )
          `
          )
          .eq("viewing_status", "disputed")
          .order("revealed_at", { ascending: false }),
        supabase
          .from("listing_reports")
          .select(
            `
            id,
            listing_id,
            reporter_id,
            reason,
            details,
            status,
            created_at,
            listings (
              id,
              title,
              neighborhood,
              county,
              status
            )
          `
          )
          .eq("status", "open")
          .order("created_at", { ascending: false }),
      ]);

      const loadError =
        pendingRes.error ||
        listingsRes.error ||
        disputesRes.error ||
        reportsRes.error;
      if (loadError) setActionError(loadError.message);

      setManagers((pendingRes.data as PendingManager[]) || []);
      setListings((listingsRes.data as AdminListing[]) || []);

      const normalizedDisputes: DisputedReveal[] = (
        disputesRes.data || []
      ).map((row) => {
        const joined = row.listings as unknown as
          | DisputedReveal["listings"]
          | DisputedReveal["listings"][];
        return {
          id: row.id,
          listing_id: row.listing_id,
          viewing_status: row.viewing_status,
          revealed_at: row.revealed_at,
          listings: Array.isArray(joined) ? joined[0] ?? null : joined,
        };
      });

      setDisputes(normalizedDisputes);

      const normalizedReports: ListingReport[] = (reportsRes.data || []).map(
        (row) => {
          const joined = row.listings as unknown as
            | ListingReport["listings"]
            | ListingReport["listings"][];
          return {
            id: row.id,
            listing_id: row.listing_id,
            reporter_id: row.reporter_id,
            reason: row.reason,
            details: row.details,
            status: row.status,
            created_at: row.created_at,
            listings: Array.isArray(joined) ? joined[0] ?? null : joined,
          };
        }
      );
      setReports(normalizedReports);
      setLoading(false);
    };

    loadControlRoom();
  }, [router]);

  const openPrivateDoc = async (path: string | null, title: string) => {
    if (!path) return;
    setDocumentBusy(title);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/admin/kyc-file?path=${encodeURIComponent(path)}`
      );
      const result = (await response.json()) as {
        signedUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.signedUrl) {
        setActionError(result.error || "Could not open the KYC document.");
        return;
      }

      setDocumentPreview({
        title,
        url: result.signedUrl,
        isPdf: /\.pdf(?:$|[?#])/i.test(path),
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not open the KYC document."
      );
    } finally {
      setDocumentBusy(null);
    }
  };

  const handleKycDecision = async (
    managerId: string,
    decision: "approved" | "rejected"
  ) => {
    setBusyId(managerId);
    setActionError(null);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        kyc_status: decision,
        kyc_notes:
          decision === "rejected"
            ? "Document could not be verified. Upload a clearer ID and ownership proof."
            : null,
      })
      .eq("id", managerId);

    if (error) {
      setActionError(error.message);
      setBusyId(null);
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "kyc_status",
          managerId,
          decision,
        }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setActionError(
          `KYC decision saved, but notification failed: ${
            result.error || "Unknown error."
          }`
        );
        setBusyId(null);
        return;
      }
    } catch (notificationError) {
      setActionError(
        `KYC decision saved, but notification failed: ${
          notificationError instanceof Error
            ? notificationError.message
            : "Network error."
        }`
      );
      setBusyId(null);
      return;
    }

    setManagers((prev) => prev.filter((m) => m.id !== managerId));
    setBusyId(null);
  };

  const handleListingReportAction = async (
    report: ListingReport,
    action: "review" | "dismiss" | "archive"
  ) => {
    setBusyId(report.id);
    setActionError(null);
    const supabase = createClient();

    if (action === "archive") {
      const { error } = await supabase
        .from("listings")
        .update({ status: "archived" })
        .eq("id", report.listing_id);
      if (error) {
        setActionError(error.message);
        setBusyId(null);
        return;
      }
      setListings((current) =>
        current.map((item) =>
          item.id === report.listing_id ? { ...item, status: "archived" } : item
        )
      );
    }

    const nextStatus =
      action === "review" ? "reviewed" : action === "dismiss" ? "dismissed" : "archived";
    const { error } = await supabase
      .from("listing_reports")
      .update({ status: nextStatus, reviewed_at: new Date().toISOString() })
      .eq("id", report.id);

    if (error) {
      setActionError(error.message);
      setBusyId(null);
      return;
    }

    setReports((current) => current.filter((item) => item.id !== report.id));
    setBusyId(null);
  };

  const toggleListingField = async (
    listing: AdminListing,
    field: "is_featured" | "has_3d_tour"
  ) => {
    setBusyId(listing.id);
    const nextValue = !listing[field];
    const supabase = createClient();

    const { error } = await supabase
      .from("listings")
      .update({ [field]: nextValue })
      .eq("id", listing.id);

    if (!error) {
      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id ? { ...item, [field]: nextValue } : item
        )
      );
    }
    setBusyId(null);
  };

  const toggleListingStatus = async (listing: AdminListing) => {
    setBusyId(listing.id);
    const nextStatus = listing.status === "active" ? "paused" : "active";
    const supabase = createClient();

    const { error } = await supabase
      .from("listings")
      .update({ status: nextStatus })
      .eq("id", listing.id);

    if (!error) {
      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id ? { ...item, status: nextStatus } : item
        )
      );
    }
    setBusyId(null);
  };

  const handleDisputeAction = async (
    dispute: DisputedReveal,
    action: "pause_and_approve" | "dismiss"
  ) => {
    setBusyId(dispute.id);
    const supabase = createClient();

    if (action === "pause_and_approve" && dispute.listing_id) {
      await supabase
        .from("listings")
        .update({ status: "paused", vacant_units: 0 })
        .eq("id", dispute.listing_id);

      setListings((prev) =>
        prev.map((l) =>
          l.id === dispute.listing_id ? { ...l, status: "paused" } : l
        )
      );
    }

    await supabase
      .from("contact_reveals")
      .update({
        viewing_status:
          action === "pause_and_approve" ? "refund_approved" : "resolved",
      })
      .eq("id", dispute.id);

    setDisputes((prev) => prev.filter((d) => d.id !== dispute.id));
    setBusyId(null);
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
        <p className="text-sm text-ink-secondary">Checking admin access...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <div className="rounded-2xl border border-danger/30 bg-card p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-danger" />
          <h1 className="mt-3 text-lg font-bold">Admin Access Only</h1>
          <p className="mt-1.5 text-xs text-ink-secondary">
            To promote your own account to Admin for testing, run this in Supabase SQL Editor:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-canvas p-3 text-left text-[11px] text-emerald-brand">
            {`update public.profiles set role = 'admin' where phone_number = '+2547XXXXXXXX';`}
          </pre>
          <Link
            href="/"
            className="mt-4 inline-block text-xs font-bold text-emerald-brand hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AppShell userEmail={userEmail} userRole="admin">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Admin Control Room
            </h1>
            <p className="mt-0.5 text-xs text-ink-secondary">
              Verify managers, manage Featured &amp; 360° badges, and resolve 24h disputes
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-brand/10 px-3 py-1 text-xs font-bold text-emerald-brand">
            <ShieldCheck className="h-3.5 w-3.5" />
            Operator Mode
          </span>
        </div>

        {actionError && (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger"
          >
            {actionError}
          </p>
        )}

        {/* Control-room navigation */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "kyc"
                ? "bg-emerald-brand text-white"
                : "border border-subtle bg-card text-ink-secondary hover:text-ink"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            KYC Queue ({managers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "listings"
                ? "bg-emerald-brand text-white"
                : "border border-subtle bg-card text-ink-secondary hover:text-ink"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Listings &amp; Boosts ({listings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("disputes")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "disputes"
                ? "bg-emerald-brand text-white"
                : "border border-subtle bg-card text-ink-secondary hover:text-ink"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            24h Disputes ({disputes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "reports"
                ? "bg-emerald-brand text-white"
                : "border border-subtle bg-card text-ink-secondary hover:text-ink"
            }`}
          >
            <FileSearch className="h-3.5 w-3.5" />
            Listing Reports ({reports.length})
          </button>
        </div>

        {/* TAB 1: MANAGER KYC QUEUE */}
        {activeTab === "kyc" && (
          <>
            {managers.length === 0 ? (
              <div className="rounded-2xl border border-subtle bg-card p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-brand" />
                <p className="mt-2 text-sm font-semibold">All caught up</p>
                <p className="text-xs text-ink-secondary">
                  No pending manager KYC submissions right now.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {managers.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-subtle bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold">{m.full_name}</h2>
                        <p className="text-xs text-ink-secondary">
                          Phone: {m.phone_number || "N/A"} • KRA PIN:{" "}
                          <span className="font-mono font-semibold text-ink">
                            {m.kra_pin || "N/A"}
                          </span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!m.id_doc_url || documentBusy === "National ID"}
                          onClick={() =>
                            openPrivateDoc(m.id_doc_url, "National ID")
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-subtle bg-canvas px-3 py-1.5 text-xs font-semibold hover:border-emerald-brand"
                        >
                          View National ID <ExternalLink className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={
                            !m.ownership_doc_url ||
                            documentBusy === "Ownership Doc"
                          }
                          onClick={() =>
                            openPrivateDoc(m.ownership_doc_url, "Ownership Doc")
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-subtle bg-canvas px-3 py-1.5 text-xs font-semibold hover:border-emerald-brand"
                        >
                          View Ownership Doc <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3 border-t border-subtle pt-4">
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => handleKycDecision(m.id, "approved")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-brand py-2.5 text-xs font-bold text-white hover:bg-emerald-hover disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve Manager
                      </button>
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => handleKycDecision(m.id, "rejected")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-danger/40 bg-danger/10 py-2.5 text-xs font-bold text-danger hover:bg-danger/20 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: LISTINGS, FEATURED BOOSTS & 360° BADGES */}
        {activeTab === "listings" && (
          <div className="space-y-3">
            {listings.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-subtle bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted-surface px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink-secondary">
                      {item.category}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.status === "active"
                          ? "bg-emerald-brand/10 text-emerald-brand"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <Link
                    href={`/listings/${item.id}`}
                    className="mt-1 block truncate text-sm font-bold text-ink hover:text-emerald-brand"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-ink-secondary">
                    {item.neighborhood}, {item.county} • KES{" "}
                    {Number(item.price_kes).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => toggleListingField(item, "is_featured")}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      item.is_featured
                        ? "bg-amber-featured text-slate-950"
                        : "border border-subtle bg-canvas text-ink-secondary hover:text-ink"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {item.is_featured ? "Featured" : "Feature"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => toggleListingField(item, "has_3d_tour")}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      item.has_3d_tour
                        ? "bg-emerald-brand/15 text-emerald-brand"
                        : "border border-subtle bg-canvas text-ink-secondary hover:text-ink"
                    }`}
                  >
                    <Orbit className="h-3.5 w-3.5" />
                    360°
                  </button>

                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => toggleListingStatus(item)}
                    className="inline-flex items-center gap-1 rounded-xl border border-subtle bg-canvas px-3 py-1.5 text-xs font-bold text-ink hover:border-emerald-brand"
                  >
                    {item.status === "active" ? (
                      <>
                        <PauseCircle className="h-3.5 w-3.5 text-danger" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-3.5 w-3.5 text-emerald-brand" />
                        Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: 24H REFUND & UNAVAILABLE DISPUTES */}
        {activeTab === "disputes" && (
          <>
            {disputes.length === 0 ? (
              <div className="rounded-2xl border border-subtle bg-card p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-brand" />
                <p className="mt-2 text-sm font-semibold">No open disputes</p>
                <p className="text-xs text-ink-secondary">
                  Flagged unavailable or occupied units will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-2xl border border-danger/30 bg-card p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="rounded-md bg-danger/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-danger">
                          Reported Occupied / Unreachable
                        </span>
                        <h3 className="mt-1.5 text-sm font-bold text-ink">
                          {d.listings?.title || "Listing"}
                        </h3>
                        <p className="text-xs text-ink-secondary">
                          {d.listings?.neighborhood}, {d.listings?.county} •
                          Revealed{" "}
                          {new Date(d.revealed_at).toLocaleString("en-KE")}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId === d.id}
                          onClick={() =>
                            handleDisputeAction(d, "pause_and_approve")
                          }
                          className="rounded-xl bg-danger px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          Pause Unit &amp; Approve Refund
                        </button>
                        <button
                          type="button"
                          disabled={busyId === d.id}
                          onClick={() => handleDisputeAction(d, "dismiss")}
                          className="rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs font-bold text-ink hover:border-emerald-brand disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "reports" && (
          <section className="space-y-3">
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-subtle bg-card p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-brand" />
                <p className="mt-2 text-sm font-semibold">No open listing reports</p>
                <p className="text-xs text-ink-secondary">
                  New tenant reports will appear here for moderation.
                </p>
              </div>
            ) : (
              reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-subtle bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="inline-flex rounded-full bg-muted-surface px-2.5 py-1 text-[10px] font-bold uppercase text-ink-secondary">
                        {REPORT_REASON_LABELS[report.reason] || report.reason}
                      </p>
                      <Link
                        href={`/listings/${report.listing_id}`}
                        className="mt-2 block text-sm font-bold text-ink hover:text-emerald-brand"
                      >
                        {report.listings?.title || "Listing"}
                      </Link>
                      <p className="text-xs text-ink-secondary">
                        {report.listings?.neighborhood},{" "}
                        {report.listings?.county} · Reported{" "}
                        {new Date(report.created_at).toLocaleString("en-KE")}
                      </p>
                      {report.details && (
                        <p className="mt-2 whitespace-pre-wrap text-xs text-ink">
                          {report.details}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === report.id}
                        onClick={() =>
                          handleListingReportAction(report, "review")
                        }
                        className="rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs font-bold text-ink-secondary hover:border-emerald-brand hover:text-emerald-brand disabled:opacity-50"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        type="button"
                        disabled={busyId === report.id}
                        onClick={() =>
                          handleListingReportAction(report, "dismiss")
                        }
                        className="rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs font-bold text-ink-secondary hover:text-ink disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        disabled={
                          busyId === report.id ||
                          report.listings?.status === "archived"
                        }
                        onClick={() =>
                          handleListingReportAction(report, "archive")
                        }
                        className="rounded-xl bg-danger px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Archive Listing
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>

      {documentPreview && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-canvas/90 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDocumentPreview(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="kyc-document-title"
            className="max-h-[90dvh] w-full max-w-4xl overflow-hidden rounded-t-[28px] border border-subtle bg-card p-4 shadow-2xl sm:rounded-[28px] sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="kyc-document-title"
                className="text-sm font-extrabold text-ink"
              >
                {documentPreview.title}
              </h2>
              <button
                type="button"
                onClick={() => setDocumentPreview(null)}
                aria-label="Close document preview"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-surface text-ink-secondary hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {documentPreview.isPdf ? (
              <iframe
                title={documentPreview.title}
                src={documentPreview.url}
                className="h-[75dvh] w-full rounded-xl border border-subtle bg-canvas"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={documentPreview.url}
                alt={documentPreview.title}
                className="mx-auto max-h-[75dvh] max-w-full rounded-xl object-contain"
              />
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}

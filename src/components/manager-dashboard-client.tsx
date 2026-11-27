"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Compass,
  ExternalLink,
  KeyRound,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ManagerKycPanel,
  type ManagerProfileData,
} from "@/components/manager-kyc-panel";

export interface ManagerBuildingRow {
  id: string;
  building_code: string | null;
  name: string;
  county: string;
  neighborhood: string;
  landmark: string | null;
  is_verified: boolean;
}

export interface ManagerListingRow {
  id: string;
  building_id: string | null;
  category: string;
  archetype: string;
  title: string;
  unit_tag: string | null;
  price_kes: number;
  vacant_units: number;
  county: string;
  neighborhood: string;
  is_featured: boolean;
  has_3d_tour: boolean;
  concierge_3d_requested: boolean;
  status: string;
  cover_url: string | null;
  caretaker_name: string | null;
  caretaker_phone: string | null;
  unlocks_count: number;
}

export interface ManagerLeadRow {
  id: string;
  listing_id: string;
  listing_title: string;
  unit_tag: string | null;
  viewing_status: string;
  revealed_at: string;
}

interface ManagerDashboardClientProps {
  profile: ManagerProfileData;
  initialBuildings: ManagerBuildingRow[];
  initialListings: ManagerListingRow[];
  initialLeads: ManagerLeadRow[];
}

export function ManagerDashboardClient({
  profile,
  initialBuildings,
  initialListings,
  initialLeads,
}: ManagerDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"units" | "kyc" | "leads">(
    "units"
  );
  const [listings, setListings] = useState(initialListings);
  const [leads, setLeads] = useState(initialLeads);
  const [buildings, setBuildings] = useState(initialBuildings);
  const [busyListingId, setBusyListingId] = useState<string | null>(null);
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);

  // Quick Add Building state
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [bName, setBName] = useState("");
  const [bCode, setBCode] = useState("");
  const [bCounty, setBCounty] = useState("Nairobi");
  const [bNeighborhood, setBNeighborhood] = useState("");
  const [bLandmark, setBLandmark] = useState("");
  const [savingBuilding, setSavingBuilding] = useState(false);

  const totalVacant = listings.reduce(
    (sum, item) => sum + (item.status === "active" ? item.vacant_units : 0),
    0
  );
  const totalUnlocks = listings.reduce(
    (sum, item) => sum + item.unlocks_count,
    0
  );

  const handleVacancyDelta = async (listing: ManagerListingRow, delta: number) => {
    const nextVacant = Math.max(0, listing.vacant_units + delta);
    if (nextVacant === listing.vacant_units) return;

    setBusyListingId(listing.id);
    const supabase = createClient();

    const nextStatus =
      nextVacant === 0
        ? "occupied"
        : listing.status === "occupied"
        ? "active"
        : listing.status;

    const { error } = await supabase
      .from("listings")
      .update({
        vacant_units: nextVacant,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listing.id);

    setBusyListingId(null);

    if (!error) {
      setListings((prev) =>
        prev.map((row) =>
          row.id === listing.id
            ? { ...row, vacant_units: nextVacant, status: nextStatus }
            : row
        )
      );
    }
  };

  const handleToggleStatus = async (listing: ManagerListingRow) => {
    const nextStatus = listing.status === "active" ? "paused" : "active";
    setBusyListingId(listing.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("listings")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listing.id);

    setBusyListingId(null);

    if (!error) {
      setListings((prev) =>
        prev.map((row) =>
          row.id === listing.id ? { ...row, status: nextStatus } : row
        )
      );
    }
  };

  const handleViewingStatusUpdate = async (
    lead: ManagerLeadRow,
    viewingStatus: "scheduled" | "viewed"
  ) => {
    setBusyLeadId(lead.id);
    setLeadError(null);

    try {
      const response = await fetch("/api/manager/viewing-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revealId: lead.id, viewingStatus }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setLeadError(result.error || "Could not update the viewing status.");
        return;
      }

      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id ? { ...item, viewing_status: viewingStatus } : item
        )
      );
    } catch (error) {
      setLeadError(
        error instanceof Error
          ? error.message
          : "Could not update the viewing status."
      );
    } finally {
      setBusyLeadId(null);
    }
  };

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim() || !bNeighborhood.trim()) return;

    setSavingBuilding(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("buildings")
      .insert({
        manager_id: profile.id,
        name: bName.trim(),
        building_code: bCode.trim().toUpperCase() || null,
        county: bCounty.trim(),
        neighborhood: bNeighborhood.trim(),
        landmark: bLandmark.trim() || null,
      })
      .select(
        "id, building_code, name, county, neighborhood, landmark, is_verified"
      )
      .single();

    setSavingBuilding(false);

    if (!error && data) {
      setBuildings((prev) => [data, ...prev]);
      setBName("");
      setBCode("");
      setBNeighborhood("");
      setBLandmark("");
      setShowBuildingForm(false);
      router.refresh();
    }
  };

  const kycStatus = profile.kyc_status || "unverified";
  const isKycVerified =
    kycStatus === "verified" || kycStatus === "approved";

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-28 md:pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-brand/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-brand">
              <Building2 className="h-3.5 w-3.5" />
              Property Manager Hub
            </span>
            {isKycVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-brand">
                <BadgeCheck className="h-3.5 w-3.5" /> KYC Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("kyc")}
                className="inline-flex items-center gap-1 rounded-full bg-amber-featured/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-featured hover:underline"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {kycStatus === "pending" ? "KYC Pending" : "Complete KYC"}
              </button>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            {profile.full_name || "Manager Dashboard"}
          </h1>
          <p className="text-xs text-ink-secondary">
            Manage vacant units in real time, verify caretaker credentials, and
            track tenant contact unlocks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBuildingForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-card px-3.5 py-2.5 text-xs font-extrabold text-ink transition hover:border-emerald-brand"
          >
            <Building2 className="h-4 w-4 text-emerald-brand" />
            + Building
          </button>

          <Link
            href="/manager/listings/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-brand px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-hover"
          >
            <Plus className="h-4 w-4" />
            Add New Unit
          </Link>
        </div>
      </div>

      {/* Optional Quick Building Creator */}
      {showBuildingForm && (
        <form
          onSubmit={handleCreateBuilding}
          className="space-y-3 rounded-2xl border border-emerald-brand/40 bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink">
              Register Apartment / Plot Building
            </h2>
            <button
              type="button"
              onClick={() => setShowBuildingForm(false)}
              className="text-xs font-bold text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <input
              type="text"
              required
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              placeholder="Building Name (e.g. Neema Heights)"
              className="rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-brand"
            />
            <input
              type="text"
              value={bCode}
              onChange={(e) => setBCode(e.target.value)}
              placeholder="Code (e.g. KHW-04)"
              className="rounded-xl border border-subtle bg-canvas px-3 py-2 font-mono text-xs uppercase text-ink outline-none focus:border-emerald-brand"
            />
            <input
              type="text"
              required
              value={bCounty}
              onChange={(e) => setBCounty(e.target.value)}
              placeholder="County (e.g. Nairobi)"
              className="rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-brand"
            />
            <input
              type="text"
              required
              value={bNeighborhood}
              onChange={(e) => setBNeighborhood(e.target.value)}
              placeholder="Neighborhood (e.g. Kahawa Wendani)"
              className="rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-brand"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="text"
              value={bLandmark}
              onChange={(e) => setBLandmark(e.target.value)}
              placeholder="Nearest Landmark (e.g. Opposite Magunas Supermarket)"
              className="min-w-64 flex-1 rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-brand"
            />
            <button
              type="submit"
              disabled={savingBuilding}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-brand px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-hover disabled:opacity-60"
            >
              {savingBuilding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Building
            </button>
          </div>
        </form>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-subtle bg-card p-4">
          <p className="text-[11px] font-bold uppercase text-ink-muted">
            Total Listings
          </p>
          <p className="mt-1 text-2xl font-extrabold text-ink">
            {listings.length}
          </p>
        </div>
        <div className="rounded-2xl border border-subtle bg-card p-4">
          <p className="text-[11px] font-bold uppercase text-ink-muted">
            Vacant Units Live
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-brand">
            {totalVacant}
          </p>
        </div>
        <div className="rounded-2xl border border-subtle bg-card p-4">
          <p className="text-[11px] font-bold uppercase text-ink-muted">
            Tenant Unlocks
          </p>
          <p className="mt-1 text-2xl font-extrabold text-ink">
            {totalUnlocks}
          </p>
        </div>
        <div className="rounded-2xl border border-subtle bg-card p-4">
          <p className="text-[11px] font-bold uppercase text-ink-muted">
            Buildings
          </p>
          <p className="mt-1 text-2xl font-extrabold text-ink">
            {buildings.length}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-subtle pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("units")}
          className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
            activeTab === "units"
              ? "bg-emerald-brand text-white"
              : "bg-card text-ink-secondary hover:text-ink"
          }`}
        >
          My Units ({listings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("kyc")}
          className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
            activeTab === "kyc"
              ? "bg-emerald-brand text-white"
              : "bg-card text-ink-secondary hover:text-ink"
          }`}
        >
          KYC Verification
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("leads")}
          className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
            activeTab === "leads"
              ? "bg-emerald-brand text-white"
              : "bg-card text-ink-secondary hover:text-ink"
          }`}
        >
          Tenant Unlocks ({leads.length})
        </button>
      </div>

      {/* TAB 1: MY UNITS */}
      {activeTab === "units" && (
        <div className="space-y-3">
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-subtle bg-card p-8 text-center">
              <Building2 className="mx-auto h-10 w-10 text-emerald-brand" />
              <h2 className="mt-3 text-base font-extrabold text-ink">
                No Property Units Listed Yet
              </h2>
              <p className="mx-auto mt-1 max-w-md text-xs text-ink-secondary">
                Publish your first apartment, bedsitter, land parcel, or
                auction property with direct caretaker contacts—zero broker
                middlemen.
              </p>
              <Link
                href="/manager/listings/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-brand px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-hover"
              >
                <Plus className="h-4 w-4" />
                Create First Listing
              </Link>
            </div>
          ) : (
            listings.map((item) => {
              const isBusy = busyListingId === item.id;
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-subtle bg-card p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted-surface">
                      {item.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cover_url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-muted">
                          <Building2 className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-muted-surface px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink-secondary">
                          {item.category}
                        </span>
                        {item.unit_tag && (
                          <span className="rounded-md bg-emerald-brand/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-brand">
                            {item.unit_tag}
                          </span>
                        )}
                        {item.has_3d_tour && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                            <Compass className="h-3 w-3" /> 360°
                          </span>
                        )}
                        {item.is_featured && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-featured/15 px-2 py-0.5 text-[10px] font-bold text-amber-featured">
                            <Sparkles className="h-3 w-3" /> Featured
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 text-sm font-extrabold text-ink">
                        {item.title}
                      </h3>

                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-secondary">
                        <MapPin className="h-3 w-3 text-emerald-brand" />
                        {item.neighborhood}, {item.county} •{" "}
                        <strong className="text-ink">
                          KES {Number(item.price_kes).toLocaleString()}
                        </strong>
                      </p>

                      <p className="mt-1 text-[11px] text-ink-muted">
                        Caretaker: {item.caretaker_name || "Not set"} (
                        {item.caretaker_phone || "—"}) •{" "}
                        <span className="font-bold text-emerald-brand">
                          {item.unlocks_count} unlocks
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right Controls: Live Vacancy Stepper + Status + Preview */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                    {/* Vacant Units Stepper */}
                    <div className="flex items-center gap-2 rounded-xl border border-subtle bg-canvas px-2.5 py-1.5">
                      <span className="text-[10px] font-bold uppercase text-ink-muted">
                        Vacant
                      </span>
                      <button
                        type="button"
                        disabled={isBusy || item.vacant_units <= 0}
                        onClick={() => handleVacancyDelta(item, -1)}
                        aria-label="Decrease vacant units"
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-ink hover:bg-muted-surface disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-mono text-xs font-extrabold text-ink">
                        {item.vacant_units}
                      </span>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleVacancyDelta(item, 1)}
                        aria-label="Increase vacant units"
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-ink hover:bg-muted-surface disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Active / Paused Pill */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleStatus(item)}
                      className={`rounded-xl px-3 py-1.5 text-[11px] font-extrabold uppercase transition ${
                        item.status === "active"
                          ? "bg-emerald-brand/15 text-emerald-brand"
                          : "bg-muted-surface text-ink-muted"
                      }`}
                    >
                      {item.status}
                    </button>

                    <Link
                      href={`/listings/${item.id}`}
                      aria-label="View public listing"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-subtle bg-canvas text-ink-secondary hover:border-emerald-brand hover:text-emerald-brand"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: KYC VERIFICATION */}
      {activeTab === "kyc" && <ManagerKycPanel profile={profile} />}

      {/* TAB 3: TENANT UNLOCKS */}
      {activeTab === "leads" && (
        <div className="space-y-3">
          {leads.length === 0 ? (
            <div className="rounded-2xl border border-subtle bg-card p-8 text-center">
              <Users className="mx-auto h-9 w-9 text-ink-muted" />
              <h3 className="mt-2 text-sm font-extrabold text-ink">
                No Tenant Unlocks Yet
              </h3>
              <p className="mt-1 text-xs text-ink-secondary">
                When verified pass-holders unlock your caretaker contacts,
                each reveal appears here in real time.
              </p>
            </div>
          ) : (
            <>
              {leadError && (
                <p role="alert" className="text-xs font-semibold text-danger">
                  {leadError}
                </p>
              )}
              {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-subtle bg-card p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-brand/15 text-emerald-brand">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-ink">
                      {lead.listing_title}{" "}
                      {lead.unit_tag ? `(${lead.unit_tag})` : ""}
                    </p>
                    <p className="text-[11px] text-ink-secondary">
                      Unlocked on{" "}
                      {new Date(lead.revealed_at).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted-surface px-3 py-1 text-[11px] font-extrabold capitalize text-ink-secondary">
                    {lead.viewing_status || "unlocked"}
                  </span>
                  <button
                    type="button"
                    disabled={
                      busyLeadId === lead.id ||
                      lead.viewing_status === "scheduled" ||
                      lead.viewing_status === "viewed" ||
                      lead.viewing_status === "disputed" ||
                      lead.viewing_status === "refund_approved"
                    }
                    onClick={() =>
                      handleViewingStatusUpdate(lead, "scheduled")
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-subtle bg-canvas px-3 py-1.5 text-[11px] font-bold text-ink-secondary hover:border-emerald-brand hover:text-emerald-brand disabled:opacity-50"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Schedule viewing
                  </button>
                  <button
                    type="button"
                    disabled={
                      busyLeadId === lead.id ||
                      lead.viewing_status === "viewed" ||
                      lead.viewing_status === "disputed" ||
                      lead.viewing_status === "refund_approved"
                    }
                    onClick={() => handleViewingStatusUpdate(lead, "viewed")}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-brand px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-hover disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark viewed
                  </button>
                </div>
              </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

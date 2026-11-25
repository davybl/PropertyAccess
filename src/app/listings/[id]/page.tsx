import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  Maximize2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ListingMediaViewer } from "@/components/listing-media-viewer";
import {
  CaretakerUnlockCard,
  type RevealedContactData,
} from "@/components/caretaker-unlock-card";
import type {
  ActivePassSummary,
  ListingMediaItem,
  PropertyCategory,
} from "@/types/property";

interface ListingDetailRow {
  id: string;
  category: PropertyCategory;
  archetype: "apartment" | "bedsitter" | "plot" | "auction";
  title: string;
  unit_tag: string | null;
  description: string | null;
  price_kes: number;
  deposit_kes: number | null;
  deposit_terms: string | null;
  vacant_units: number;
  move_in_availability: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  amenities: string[];
  county: string;
  neighborhood: string;
  landmark: string | null;
  is_featured: boolean;
  has_3d_tour: boolean;
  tour_360_url: string | null;
  status: string;
  listing_media: ListingMediaItem[];
}

async function ListingDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawListing } = await supabase
    .from("listings")
    .select(
      `
      id,
      category,
      archetype,
      title,
      unit_tag,
      description,
      price_kes,
      deposit_kes,
      deposit_terms,
      vacant_units,
      move_in_availability,
      bedrooms,
      bathrooms,
      area_sqm,
      amenities,
      county,
      neighborhood,
      landmark,
      is_featured,
      has_3d_tour,
      tour_360_url,
      status,
      listing_media (
        id,
        media_type,
        public_url,
        caption,
        sort_order
      )
    `
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!rawListing) {
    notFound();
  }

  const listing = rawListing as unknown as ListingDetailRow;
  const sortedMedia = [...(listing.listing_media || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  let userRole: string | null = null;
  let activePasses: ActivePassSummary[] = [];
  let revealsUsedToday = 0;
  let alreadyRevealed = false;
  let initialContact: RevealedContactData | null = null;

  if (user) {
    const nowIso = new Date().toISOString();
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const [profileRes, passesRes, dailyRes, existingRevealRes] =
      await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        supabase
          .from("category_passes")
          .select("id, category, expires_at")
          .eq("user_id", user.id)
          .gt("expires_at", nowIso),
        supabase
          .from("contact_reveals")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gt("revealed_at", twentyFourHoursAgo),
        supabase
          .from("contact_reveals")
          .select("id")
          .eq("user_id", user.id)
          .eq("listing_id", listing.id)
          .limit(1)
          .maybeSingle(),
      ]);

    userRole = profileRes.data?.role ?? null;
    activePasses = (passesRes.data as ActivePassSummary[]) || [];
    revealsUsedToday = dailyRes.count ?? 0;
    alreadyRevealed = Boolean(existingRevealRes.data);

    // If the user already unlocked this listing previously, fetch contact server-side
    // using their stored active_session_token so it renders unlocked immediately
    if (alreadyRevealed) {
      const { data: profToken } = await supabase
        .from("profiles")
        .select("active_session_token")
        .eq("id", user.id)
        .single();

      if (profToken?.active_session_token) {
        const { data: revealRes } = await supabase.rpc(
          "reveal_listing_contact",
          {
            p_listing_id: listing.id,
            p_session_token: profToken.active_session_token,
          }
        );

        if (revealRes?.ok) {
          initialContact = {
            caretaker_name: revealRes.caretaker_name,
            caretaker_role: revealRes.caretaker_role,
            caretaker_phone: revealRes.caretaker_phone,
            whatsapp_phone: revealRes.whatsapp_phone,
          };
        }
      }
    }
  }

  const hasActiveCategoryPass = activePasses.some(
    (p) => p.category === listing.category
  );

  const rentAmount = Number(listing.price_kes || 0);
  const depositAmount = Number(listing.deposit_kes || 0);
  const totalMoveIn = rentAmount + depositAmount;

  return (
    <AppShell
      userEmail={user?.email ?? null}
      userRole={userRole}
      activePasses={activePasses}
      revealsUsedToday={revealsUsedToday}
    >
      <div className="space-y-5 pb-20 md:pb-6">
        {/* Back Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-secondary hover:text-emerald-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>

          <div className="flex items-center gap-2">
            {listing.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-featured px-2.5 py-1 text-[10px] font-extrabold uppercase text-slate-950">
                <Sparkles className="h-3 w-3" />
                Featured
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-brand/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-brand">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified Direct
            </span>
          </div>
        </div>

        {/* 65 / 35 Desktop Bento Grid (code4.html) + Mobile Stack (code5.html) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN (65% -> 8 cols): Media Viewer, Specs, Deposit Breakdown & Amenities */}
          <div className="space-y-5 lg:col-span-8">
            <ListingMediaViewer
              title={listing.title}
              archetype={listing.archetype}
              neighborhood={listing.neighborhood}
              county={listing.county}
              has3dTour={listing.has_3d_tour}
              tour360Url={listing.tour_360_url}
              media={sortedMedia}
            />

            {/* Title, Location & Hero Price Card */}
            <div className="rounded-2xl border border-subtle bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted-surface px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink-secondary">
                      {listing.category} • {listing.archetype}
                    </span>
                    {listing.unit_tag && (
                      <span className="rounded-md bg-emerald-brand/10 px-2 py-0.5 text-[10px] font-bold text-emerald-brand">
                        {listing.unit_tag}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                    {listing.title}
                  </h1>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-secondary">
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-brand" />
                    <span>
                      {listing.neighborhood}, {listing.county}
                      {listing.landmark ? ` • Near ${listing.landmark}` : ""}
                    </span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-2xl font-extrabold tracking-tight text-emerald-brand">
                    KES {rentAmount.toLocaleString()}
                    {listing.category === "rent" && (
                      <span className="ml-1 text-xs font-medium text-ink-secondary">
                        / mo
                      </span>
                    )}
                  </p>
                  {listing.category === "rent" && (
                    <p className="mt-0.5 text-[11px] font-semibold text-ink-muted">
                      {listing.vacant_units}{" "}
                      {listing.vacant_units === 1 ? "unit vacant" : "units vacant"}
                    </p>
                  )}
                </div>
              </div>

              {/* 6-Box Specs Grid (code4.html) */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-subtle pt-4 sm:grid-cols-4">
                {listing.category !== "land" && (
                  <>
                    <div className="rounded-xl bg-canvas p-3">
                      <p className="text-[10px] font-bold uppercase text-ink-muted">
                        Bedrooms
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                        <BedDouble className="h-4 w-4 text-emerald-brand" />
                        {listing.archetype === "bedsitter"
                          ? "Studio / Bedsitter"
                          : `${listing.bedrooms ?? 1} Bedroom`}
                      </p>
                    </div>

                    <div className="rounded-xl bg-canvas p-3">
                      <p className="text-[10px] font-bold uppercase text-ink-muted">
                        Bathrooms
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                        <Bath className="h-4 w-4 text-emerald-brand" />
                        {listing.bathrooms ?? 1} Bath
                      </p>
                    </div>
                  </>
                )}

                {listing.area_sqm && (
                  <div className="rounded-xl bg-canvas p-3">
                    <p className="text-[10px] font-bold uppercase text-ink-muted">
                      Size
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                      <Maximize2 className="h-4 w-4 text-emerald-brand" />
                      {listing.area_sqm} sqm
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-canvas p-3">
                  <p className="text-[10px] font-bold uppercase text-ink-muted">
                    Availability
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                    <CalendarCheck className="h-4 w-4 text-emerald-brand" />
                    {listing.move_in_availability || "Immediate"}
                  </p>
                </div>
              </div>
            </div>

            {/* Transparent Move-In Cost Breakdown (code5.html) */}
            {listing.category === "rent" && (
              <div className="rounded-2xl border border-subtle bg-card p-5">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink">
                  Transparent Move-In Breakdown
                </h2>
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-ink-secondary">
                    <span>First Month Rent</span>
                    <span className="font-bold text-ink">
                      KES {rentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink-secondary">
                    <span>
                      Refundable Security Deposit
                      {listing.deposit_terms ? ` (${listing.deposit_terms})` : ""}
                    </span>
                    <span className="font-bold text-ink">
                      KES {depositAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-brand">
                    <span className="font-semibold">
                      Broker / Viewing Commission
                    </span>
                    <span className="font-extrabold">KES 0 (Waived)</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-subtle pt-2.5 text-sm font-extrabold text-ink">
                    <span>Estimated Total Move-In</span>
                    <span>KES {totalMoveIn.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description & Amenities */}
            <div className="rounded-2xl border border-subtle bg-card p-5 space-y-4">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink">
                  About This Property
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-ink-secondary sm:text-sm">
                  {listing.description ||
                    `Verified direct listing in ${listing.neighborhood}, ${listing.county}. Connect directly with the on-site caretaker or property owner with zero middlemen or viewing fees.`}
                </p>
              </div>

              {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
                <div className="border-t border-subtle pt-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-secondary">
                    Included Amenities
                  </h3>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {listing.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-canvas px-3 py-1.5 text-xs font-semibold text-ink"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-brand" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (35% -> 4 cols): Sticky Caretaker Unlock Card */}
          <aside className="lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              <CaretakerUnlockCard
                listingId={listing.id}
                listingTitle={listing.title}
                category={listing.category}
                priceKes={rentAmount}
                isLoggedIn={Boolean(user)}
                hasActiveCategoryPass={hasActiveCategoryPass}
                initialRevealedContact={initialContact}
                revealsUsedToday={revealsUsedToday}
              />

              <div className="rounded-2xl border border-subtle bg-card p-4 text-xs text-ink-secondary">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <ShieldCheck className="h-4 w-4 text-emerald-brand" />
                  <span>Zero-Broker Safety Guarantee</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed">
                  Never pay any viewing fee or deposit before inspecting the unit in person with the verified caretaker.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
          <p className="text-xs font-semibold text-ink-secondary">
            Loading property details...
          </p>
        </div>
      }
    >
      <ListingDetailContent params={params} />
    </Suspense>
  );
}
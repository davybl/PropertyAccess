import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Bookmark, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PropertyCard } from "@/components/property-card";
import type { ActivePassSummary, ListingItem } from "@/types/property";

async function SavedContent() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const [profileRes, savedRes, passesRes, revealsRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("saved_listings")
      .select(
        `
        listing_id,
        created_at,
        listings (
          id,
          category,
          archetype,
          title,
          unit_tag,
          price_kes,
          deposit_kes,
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
          status,
          listing_media (
            id,
            media_type,
            public_url,
            caption,
            sort_order
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("category_passes")
      .select("id, category, expires_at")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("contact_reveals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("revealed_at", twentyFourHoursAgo),
  ]);

  const savedListings: ListingItem[] = (savedRes.data || [])
    .map((row) => {
      const joined = row.listings as unknown as
        | ListingItem
        | ListingItem[]
        | null;
      return Array.isArray(joined) ? joined[0] : joined;
    })
    .filter((item): item is ListingItem =>
      Boolean(item && item.status === "active")
    );

  return (
    <AppShell
      userEmail={user.email ?? null}
      userRole={profileRes.data?.role ?? null}
      activePasses={(passesRes.data as ActivePassSummary[]) || []}
      revealsUsedToday={revealsRes.count ?? 0}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Saved Properties
            </h1>
            <p className="mt-0.5 text-xs text-ink-secondary">
              Shortlist homes and plots before activating your 7-Day Pass
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-card px-3 py-1 text-xs font-bold text-ink">
            <Bookmark className="h-3.5 w-3.5 text-emerald-brand" />
            {savedListings.length} Saved
          </span>
        </div>

        {savedListings.length === 0 ? (
          <div className="rounded-2xl border border-subtle bg-card p-10 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-ink-muted" />
            <p className="mt-3 text-sm font-bold text-ink">
              No saved properties yet
            </p>
            <p className="mt-1 text-xs text-ink-secondary">
              Tap the heart icon on any listing in Explore to bookmark it here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-hover"
            >
              <Compass className="h-4 w-4" />
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedListings.map((listing) => (
              <PropertyCard
                key={listing.id}
                listing={listing}
                initialSaved
                isLoggedIn
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SavedListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
          <p className="text-xs font-semibold text-ink-secondary">
            Loading saved properties...
          </p>
        </div>
      }
    >
      <SavedContent />
    </Suspense>
  );
}

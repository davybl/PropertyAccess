import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ExploreFeed } from "@/components/explore-feed";
import type { ActivePassSummary, ListingItem } from "@/types/property";

async function ExploreContent() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawListings } = await supabase
    .from("listings")
    .select(
      `
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
    `
    )
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  let userRole: string | null = null;
  let savedIds: string[] = [];
  let activePasses: ActivePassSummary[] = [];
  let revealsUsedToday = 0;

  if (user) {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const [profileRes, savedRes, passesRes, revealsRes] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("saved_listings")
        .select("listing_id")
        .eq("user_id", user.id),
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

    userRole = profileRes.data?.role ?? null;
    savedIds = (savedRes.data || []).map((row) => row.listing_id);
    activePasses = (passesRes.data as ActivePassSummary[]) || [];
    revealsUsedToday = revealsRes.count ?? 0;
  }

  return (
    <AppShell
      userEmail={user?.email ?? null}
      userRole={userRole}
      activePasses={activePasses}
      revealsUsedToday={revealsUsedToday}
    >
      <ExploreFeed
        listings={(rawListings as ListingItem[]) || []}
        savedIds={savedIds}
        isLoggedIn={Boolean(user)}
      />
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
          <p className="text-xs font-semibold text-ink-secondary">
            Loading verified listings...
          </p>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}

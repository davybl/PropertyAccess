import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import {
  ManagerDashboardClient,
  type ManagerBuildingRow,
  type ManagerLeadRow,
  type ManagerListingRow,
} from "@/components/manager-dashboard-client";
import type { ManagerProfileData } from "@/components/manager-kyc-panel";
import { createClient } from "@/lib/supabase/server";

async function ManagerDashboardContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawProfile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone_number, role, kyc_status, kyc_notes, kra_pin, id_doc_url, ownership_doc_url"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !rawProfile) {
    throw new Error(profileError?.message || "Manager profile could not be loaded.");
  }
  if (rawProfile.role !== "manager") redirect("/");

  const profile = rawProfile as ManagerProfileData;
  const [buildingsResult, listingsResult] = await Promise.all([
    supabase
      .from("buildings")
      .select(
        "id, building_code, name, county, neighborhood, landmark, is_verified"
      )
      .eq("manager_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select(
        `
        id,
        building_id,
        category,
        archetype,
        title,
        unit_tag,
        price_kes,
        vacant_units,
        county,
        neighborhood,
        is_featured,
        has_3d_tour,
        concierge_3d_requested,
        status,
        listing_media (public_url, media_type, sort_order),
        listing_contacts (caretaker_name, caretaker_phone)
      `
      )
      .eq("manager_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (buildingsResult.error) throw new Error(buildingsResult.error.message);
  if (listingsResult.error) throw new Error(listingsResult.error.message);

  const rawListings = listingsResult.data || [];
  const listingIds = rawListings.map((listing) => listing.id);
  const listingDetails = new Map(
    rawListings.map((listing) => [listing.id, listing])
  );
  const revealResult =
    listingIds.length > 0
      ? await supabase
          .from("contact_reveals")
          .select("id, listing_id, viewing_status, revealed_at")
          .in("listing_id", listingIds)
          .order("revealed_at", { ascending: false })
      : { data: [], error: null };

  if (revealResult.error) throw new Error(revealResult.error.message);

  const unlockCounts = new Map<string, number>();
  for (const reveal of revealResult.data || []) {
    unlockCounts.set(
      reveal.listing_id,
      (unlockCounts.get(reveal.listing_id) || 0) + 1
    );
  }

  const listings: ManagerListingRow[] = rawListings.map((listing) => {
    const media = [...(listing.listing_media || [])].sort(
      (left, right) => left.sort_order - right.sort_order
    );
    const contacts = listing.listing_contacts;
    const contact = Array.isArray(contacts) ? contacts[0] : contacts;

    return {
      id: listing.id,
      building_id: listing.building_id,
      category: listing.category,
      archetype: listing.archetype,
      title: listing.title,
      unit_tag: listing.unit_tag,
      price_kes: listing.price_kes,
      vacant_units: listing.vacant_units,
      county: listing.county,
      neighborhood: listing.neighborhood,
      is_featured: listing.is_featured,
      has_3d_tour: listing.has_3d_tour,
      concierge_3d_requested: listing.concierge_3d_requested,
      status: listing.status,
      cover_url: media[0]?.public_url || null,
      caretaker_name: contact?.caretaker_name || null,
      caretaker_phone: contact?.caretaker_phone || null,
      unlocks_count: unlockCounts.get(listing.id) || 0,
    };
  });

  const leads: ManagerLeadRow[] = (revealResult.data || []).flatMap((reveal) => {
    const listing = listingDetails.get(reveal.listing_id);
    if (!listing) return [];

    return [
      {
        id: reveal.id,
        listing_id: reveal.listing_id,
        listing_title: listing.title,
        unit_tag: listing.unit_tag,
        viewing_status: reveal.viewing_status,
        revealed_at: reveal.revealed_at,
      },
    ];
  });

  return (
    <AppShell userEmail={user.email ?? null} userRole={profile.role}>
      <ManagerDashboardClient
        profile={profile}
        initialBuildings={(buildingsResult.data as ManagerBuildingRow[]) || []}
        initialListings={listings}
        initialLeads={leads}
      />
    </AppShell>
  );
}

export default function ManagerPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <p className="text-xs font-semibold text-ink-secondary">
            Loading manager dashboard...
          </p>
        </div>
      }
    >
      <ManagerDashboardContent />
    </Suspense>
  );
}

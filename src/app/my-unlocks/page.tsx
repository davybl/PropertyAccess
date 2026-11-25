import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  MyUnlocksClient,
  type RevealHistoryItem,
} from "@/components/my-unlocks-client";
import type { ActivePassSummary } from "@/types/property";

async function MyUnlocksContent() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nowIso = new Date().toISOString();
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const [profileRes, passesRes, dailyCountRes, revealsRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("category_passes")
      .select("id, category, expires_at")
      .eq("user_id", user.id)
      .gt("expires_at", nowIso)
      .order("expires_at", { ascending: false }),
    supabase
      .from("contact_reveals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("revealed_at", twentyFourHoursAgo),
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
          unit_tag,
          category,
          price_kes,
          neighborhood,
          county
        )
      `
      )
      .eq("user_id", user.id)
      .order("revealed_at", { ascending: false }),
  ]);

  const activePasses = (passesRes.data as ActivePassSummary[]) || [];
  const revealsUsedToday = dailyCountRes.count ?? 0;
  const remainingToday = Math.max(0, 7 - revealsUsedToday);

  const unlockedHistory: RevealHistoryItem[] = (revealsRes.data || []).map(
    (row) => {
      const joined = row.listings as unknown as
        | RevealHistoryItem["listings"]
        | RevealHistoryItem["listings"][];
      return {
        id: row.id,
        listing_id: row.listing_id,
        viewing_status: row.viewing_status,
        revealed_at: row.revealed_at,
        listings: Array.isArray(joined) ? joined[0] ?? null : joined,
      };
    }
  );

  return (
    <AppShell
      userEmail={user.email ?? null}
      userRole={profileRes.data?.role ?? null}
      activePasses={activePasses}
      revealsUsedToday={revealsUsedToday}
    >
      <MyUnlocksClient
        activePasses={activePasses}
        remainingToday={remainingToday}
        initialHistory={unlockedHistory}
      />
    </AppShell>
  );
}

export default function MyUnlocksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
          <p className="text-xs font-semibold text-ink-secondary">
            Loading passes &amp; unlocks...
          </p>
        </div>
      }
    >
      <MyUnlocksContent />
    </Suspense>
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { AddUnitWizard } from "@/components/add-unit-wizard";

async function NewListingContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone_number, role")
    .eq("id", user.id)
    .single();

  const { data: buildings } = await supabase
    .from("buildings")
    .select(
      "id, building_code, name, county, neighborhood, landmark, is_verified"
    )
    .eq("manager_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell
      userEmail={user.email ?? null}
      userRole={profile?.role ?? "manager"}
    >
      <AddUnitWizard
        managerId={user.id}
        defaultCaretakerName={profile?.full_name || ""}
        defaultCaretakerPhone={profile?.phone_number || ""}
        buildings={buildings || []}
      />
    </AppShell>
  );
}

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <p className="text-xs font-semibold text-ink-secondary">
            Loading unit wizard...
          </p>
        </div>
      }
    >
      <NewListingContent />
    </Suspense>
  );
}

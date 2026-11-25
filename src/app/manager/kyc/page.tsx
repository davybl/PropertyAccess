import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowRight, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  ManagerKycPanel,
  type ManagerProfileData,
} from "@/components/manager-kyc-panel";

async function ManagerKycContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone_number, role, kyc_status, kyc_notes, kra_pin, id_doc_url, ownership_doc_url"
    )
    .eq("id", user.id)
    .single();

  const profile: ManagerProfileData = profileRow || {
    id: user.id,
    full_name: null,
    phone_number: null,
    role: "manager",
    kyc_status: "unverified",
    kyc_notes: null,
    kra_pin: null,
    id_doc_url: null,
    ownership_doc_url: null,
  };

  return (
    <AppShell
      userEmail={user.email ?? null}
      userRole={profile.role ?? "manager"}
    >
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 pb-28 md:pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-ink">
              Verify Property Ownership
            </h1>
            <p className="text-xs text-ink-secondary">
              Complete KYC or jump straight to your Property Manager Hub.
            </p>
          </div>

          <Link
            href="/manager"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-brand px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-hover"
          >
            <Building2 className="h-4 w-4" />
            Open Manager Hub
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ManagerKycPanel profile={profile} />
      </div>
    </AppShell>
  );
}

export default function ManagerKycPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4">
          <p className="text-xs font-semibold text-ink-secondary">
            Loading verification portal...
          </p>
        </div>
      }
    >
      <ManagerKycContent />
    </Suspense>
  );
}

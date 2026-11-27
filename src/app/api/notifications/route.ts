import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type NotificationRequest =
  | {
      event: "kyc_status";
      managerId: string;
      decision: "approved" | "rejected";
    }
  | {
      event: "listing_unlocked";
      listingId: string;
    };

function isNotificationRequest(value: unknown): value is NotificationRequest {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;

  if (body.event === "kyc_status") {
    return (
      typeof body.managerId === "string" &&
      (body.decision === "approved" || body.decision === "rejected")
    );
  }

  return body.event === "listing_unlocked" && typeof body.listingId === "string";
}

export async function POST(request: Request) {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON request." }, { status: 400 });
  }

  if (!isNotificationRequest(value)) {
    return Response.json({ ok: false, error: "Invalid notification request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile) {
    return Response.json({ ok: false, error: "Could not verify account role." }, { status: 403 });
  }

  const admin = createAdminClient();
  let notification: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    action_url: string;
    reference_id: string | null;
    event_key: string;
  };

  if (value.event === "kyc_status") {
    if (profile.role !== "admin") {
      return Response.json({ ok: false, error: "Admin access required." }, { status: 403 });
    }

    const { data: manager, error: managerError } = await admin
      .from("profiles")
      .select("id, role, kyc_status")
      .eq("id", value.managerId)
      .maybeSingle();

    if (managerError || manager?.role !== "manager") {
      return Response.json({ ok: false, error: "Manager account not found." }, { status: 404 });
    }
    if (manager.kyc_status !== value.decision) {
      return Response.json(
        { ok: false, error: "The manager KYC decision has not been saved." },
        { status: 409 }
      );
    }

    const approved = value.decision === "approved";
    notification = {
      user_id: manager.id,
      type: "kyc_status",
      title: approved ? "Manager verification approved" : "KYC update required",
      message: approved
        ? "Your manager account has been verified."
        : "Your KYC submission needs attention. Review your manager verification details.",
      action_url: approved ? "/manager" : "/manager/kyc",
      reference_id: null,
      event_key: value.decision,
    };
  } else {
    if (profile.role !== "tenant") {
      return Response.json({ ok: false, error: "Tenant access required." }, { status: 403 });
    }

    const { data: reveal, error: revealError } = await admin
      .from("contact_reveals")
      .select("id")
      .eq("listing_id", value.listingId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (revealError || !reveal) {
      return Response.json({ ok: false, error: "Listing unlock not found." }, { status: 404 });
    }

    const { data: listing, error: listingError } = await admin
      .from("listings")
      .select("id, manager_id, title")
      .eq("id", value.listingId)
      .maybeSingle();

    if (listingError || !listing?.manager_id) {
      return Response.json({ ok: false, error: "Listing manager not found." }, { status: 404 });
    }

    notification = {
      user_id: listing.manager_id,
      type: "listing_unlocked",
      title: "A tenant unlocked your listing",
      message: `A tenant unlocked the caretaker contact for ${listing.title}.`,
      action_url: "/manager",
      reference_id: reveal.id,
      event_key: "unlocked",
    };
  }

  const { error: insertError } = await admin
    .from("notifications")
    .upsert(notification, {
      onConflict: "user_id,type,reference_id,event_key",
      ignoreDuplicates: true,
    });

  if (insertError) {
    return Response.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

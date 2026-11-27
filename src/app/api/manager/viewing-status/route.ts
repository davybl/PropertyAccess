import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON request." }, { status: 400 });
  }

  if (!value || typeof value !== "object") {
    return Response.json({ ok: false, error: "Invalid viewing update." }, { status: 400 });
  }

  const body = value as Record<string, unknown>;
  if (
    typeof body.revealId !== "string" ||
    (body.viewingStatus !== "scheduled" && body.viewingStatus !== "viewed")
  ) {
    return Response.json({ ok: false, error: "Invalid viewing update." }, { status: 400 });
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
  if (profileError || profile?.role !== "manager") {
    return Response.json({ ok: false, error: "Manager access required." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: reveal, error: revealError } = await admin
    .from("contact_reveals")
    .select("id, user_id, listing_id, viewing_status")
    .eq("id", body.revealId)
    .maybeSingle();
  if (revealError || !reveal) {
    return Response.json({ ok: false, error: "Unlock record not found." }, { status: 404 });
  }

  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("manager_id, title")
    .eq("id", reveal.listing_id)
    .maybeSingle();
  if (listingError || listing?.manager_id !== user.id) {
    return Response.json({ ok: false, error: "You cannot update this viewing." }, { status: 403 });
  }

  if (
    reveal.viewing_status === "disputed" ||
    reveal.viewing_status === "refund_approved"
  ) {
    return Response.json(
      { ok: false, error: "A disputed viewing cannot be changed by a manager." },
      { status: 409 }
    );
  }

  if (reveal.viewing_status !== body.viewingStatus) {
    const { error: updateError } = await admin
      .from("contact_reveals")
      .update({ viewing_status: body.viewingStatus })
      .eq("id", reveal.id);
    if (updateError) {
      return Response.json({ ok: false, error: updateError.message }, { status: 500 });
    }
  }

  if (reveal.user_id) {
    const scheduled = body.viewingStatus === "scheduled";
    const { error: notificationError } = await admin
      .from("notifications")
      .upsert(
        {
          user_id: reveal.user_id,
          type: "viewing_status",
          title: scheduled ? "Viewing scheduled" : "Viewing completed",
          message: scheduled
            ? `The manager has scheduled a viewing for ${listing.title}.`
            : `The manager marked your viewing for ${listing.title} as completed.`,
          action_url: "/my-unlocks",
          reference_id: reveal.id,
          event_key: body.viewingStatus,
        },
        {
          onConflict: "user_id,type,reference_id,event_key",
          ignoreDuplicates: true,
        }
      );

    if (notificationError) {
      return Response.json(
        { ok: false, error: `Viewing updated but notification failed: ${notificationError.message}` },
        { status: 500 }
      );
    }
  }

  return Response.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initiateDarajaStkPush, normalizeKenyanPhone } from "@/lib/mpesa";
import type { PropertyCategory } from "@/types/property";

const VALID_CATEGORIES: PropertyCategory[] = [
  "rent",
  "buy",
  "land",
  "auction",
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in before paying." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      listingId?: string;
      category?: string;
      phoneNumber?: string;
    };

    const category = body.category as PropertyCategory;
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { ok: false, error: "Invalid property category." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeKenyanPhone(body.phoneNumber || "");
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Enter a valid Kenyan Safaricom/M-Pesa number (e.g., 0711431522).",
        },
        { status: 400 }
      );
    }

    // Prevent accidental double-payment if user already holds an active 7-day pass
    const { data: existingPass } = await supabase
      .from("category_passes")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", category)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (existingPass) {
      return NextResponse.json({
        ok: true,
        alreadyHasPass: true,
      });
    }

    const darajaRes = await initiateDarajaStkPush({
      phoneNumber: normalizedPhone,
      amountKes: 200,
      accountReference: `PA-${category.toUpperCase()}`,
      transactionDesc: `${category} Pass`,
    });

    const admin = createAdminClient();
    const { data: txRow, error: insertError } = await admin
      .from("mpesa_transactions")
      .insert({
        user_id: user.id,
        listing_id: body.listingId || null,
        category,
        phone_number: normalizedPhone,
        amount_kes: 200,
        merchant_request_id: darajaRes.MerchantRequestID,
        checkout_request_id: darajaRes.CheckoutRequestID,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !txRow) {
      return NextResponse.json(
        {
          ok: false,
          error: insertError?.message || "Failed to record pending payment.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      transactionId: txRow.id,
      checkoutRequestId: darajaRes.CheckoutRequestID,
      customerMessage:
        darajaRes.CustomerMessage ||
        "M-Pesa prompt sent. Enter your PIN on your phone.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to initiate M-Pesa prompt.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

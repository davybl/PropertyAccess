import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface CallbackMetadataItem {
  Name: string;
  Value?: string | number;
}

interface DarajaCallbackPayload {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: CallbackMetadataItem[];
      };
    };
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DarajaCallbackPayload;
    const callback = payload?.Body?.stkCallback;

    if (!callback?.CheckoutRequestID) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const admin = createAdminClient();
    const { data: tx } = await admin
      .from("mpesa_transactions")
      .select("id, user_id, category, status")
      .eq("checkout_request_id", callback.CheckoutRequestID)
      .maybeSingle();

    if (!tx) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Idempotency check: ignore duplicate Safaricom retries if already processed
    if (tx.status === "completed") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const resultCode = Number(callback.ResultCode ?? -1);
    const resultDesc = callback.ResultDesc || "";

    if (resultCode === 0) {
      const items = callback.CallbackMetadata?.Item || [];
      const receiptItem = items.find(
        (item) => item.Name === "MpesaReceiptNumber"
      );
      const receiptNumber = receiptItem?.Value
        ? String(receiptItem.Value)
        : null;

      await admin
        .from("mpesa_transactions")
        .update({
          status: "completed",
          mpesa_receipt_number: receiptNumber,
          result_code: 0,
          result_desc: resultDesc,
          completed_at: new Date().toISOString(),
        })
        .eq("id", tx.id);

      // Issue active 7-Day Category Pass
      const startsAt = new Date();
      const expiresAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

      await admin.from("category_passes").insert({
        user_id: tx.user_id,
        transaction_id: tx.id,
        category: tx.category,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
    } else {
      const nextStatus = resultCode === 1032 ? "cancelled" : "failed";
      await admin
        .from("mpesa_transactions")
        .update({
          status: nextStatus,
          result_code: resultCode,
          result_desc: resultDesc,
        })
        .eq("id", tx.id);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch {
    // Always acknowledge Safaricom callbacks with 200 OK so Safaricom stops retrying
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}

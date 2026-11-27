export function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    const prefix = digits.slice(3, 4);
    if (prefix === "7" || prefix === "1") return digits;
    return null;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    const prefix = digits.slice(1, 2);
    if (prefix === "7" || prefix === "1") return `254${digits.slice(1)}`;
    return null;
  }

  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `254${digits}`;
  }

  return null;
}

export function getDarajaBaseUrl(): string {
  return process.env.DARAJA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export function generateEatTimestamp(): string {
  // East Africa Time is always UTC+3 (no daylight saving)
  const eatDate = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    String(eatDate.getUTCFullYear()) +
    pad(eatDate.getUTCMonth() + 1) +
    pad(eatDate.getUTCDate()) +
    pad(eatDate.getUTCHours()) +
    pad(eatDate.getUTCMinutes()) +
    pad(eatDate.getUTCSeconds())
  );
}

export async function getDarajaAccessToken(): Promise<string> {
  const key = process.env.DARAJA_CONSUMER_KEY;
  const secret = process.env.DARAJA_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error("Daraja Consumer Key or Secret is missing in .env.local");
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");
  const baseUrl = getDarajaBaseUrl();

  const res = await fetch(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daraja OAuth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Daraja OAuth response did not include access_token");
  }

  return data.access_token;
}

export interface StkPushParams {
  phoneNumber: string;
  amountKes: number;
  accountReference: string;
  transactionDesc: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function initiateDarajaStkPush(
  params: StkPushParams
): Promise<StkPushResponse> {
  const shortCode = process.env.DARAJA_SHORTCODE || "174379";
  const tillNumber = process.env.DARAJA_TILL_NUMBER || shortCode;
  const passkey = process.env.DARAJA_PASSKEY;
  const callbackUrl =
    process.env.DARAJA_CALLBACK_URL ||
    "https://propertyaccess-ke.netlify.app/api/mpesa/callback";

  if (!passkey) {
    throw new Error("DARAJA_PASSKEY is missing in .env.local");
  }

  const timestamp = generateEatTimestamp();
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString(
    "base64"
  );

  // Buy Goods Till uses CustomerBuyGoodsOnline (PartyB = Till Number, BusinessShortCode = Store Number)
  const isBuyGoods =
    process.env.DARAJA_ENV === "production" && tillNumber !== shortCode;

  const accessToken = await getDarajaAccessToken();
  const baseUrl = getDarajaBaseUrl();

  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: isBuyGoods
      ? "CustomerBuyGoodsOnline"
      : "CustomerPayBillOnline",
    Amount: Math.round(params.amountKes),
    PartyA: params.phoneNumber,
    PartyB: isBuyGoods ? tillNumber : shortCode,
    PhoneNumber: params.phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.transactionDesc.slice(0, 13),
  };

  const res = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(
      data.errorMessage ||
        data.ResponseDescription ||
        "Safaricom STK Push request was rejected"
    );
  }

  return data as StkPushResponse;
}

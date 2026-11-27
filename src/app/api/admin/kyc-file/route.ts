import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getKycObjectPath(rawPath: string, supabaseUrl: string): string | null {
  let path = rawPath.trim();
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      if (url.origin !== new URL(supabaseUrl).origin) return null;
      path = url.pathname;
    } catch {
      return null;
    }
  }

  const marker = "/storage/v1/object/";
  const markerIndex = path.indexOf(marker);
  if (markerIndex >= 0) {
    const segments = path.slice(markerIndex + marker.length).split("/");
    if (["public", "sign", "authenticated"].includes(segments[0])) {
      segments.shift();
    }
    if (segments.shift() !== "kyc-documents") return null;
    path = segments.join("/");
  } else {
    path = path.replace(/^\/+/, "");
    if (path.startsWith("kyc-documents/")) {
      path = path.slice("kyc-documents/".length);
    }
  }

  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }

  const segments = path.split("/");
  if (
    !path ||
    path.includes("\\") ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return null;
  }

  return path;
}

export async function GET(request: Request) {
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

  if (profileError || profile?.role !== "admin") {
    return Response.json({ ok: false, error: "Admin access required." }, { status: 403 });
  }

  const rawPath = new URL(request.url).searchParams.get("path");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawPath) {
    return Response.json(
      { ok: false, error: "A document path is required." },
      { status: 400 }
    );
  }
  if (!supabaseUrl) {
    return Response.json(
      { ok: false, error: "Document storage is not configured." },
      { status: 500 }
    );
  }

  const cleanPath = getKycObjectPath(rawPath, supabaseUrl);
  if (!cleanPath) {
    return Response.json(
      { ok: false, error: "The document path is invalid." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("kyc-documents")
    .createSignedUrl(cleanPath, 3600);

  if (error || !data?.signedUrl) {
    return Response.json(
      { ok: false, error: error?.message || "Could not create document link." },
      { status: 500 }
    );
  }

  return Response.json(
    { ok: true, signedUrl: data.signedUrl },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

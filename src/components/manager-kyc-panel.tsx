"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ManagerProfileData {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  role: string | null;
  kyc_status: string | null;
  kyc_notes: string | null;
  kra_pin: string | null;
  id_doc_url: string | null;
  ownership_doc_url: string | null;
}

interface ManagerKycPanelProps {
  profile: ManagerProfileData;
}

export function ManagerKycPanel({ profile }: ManagerKycPanelProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || "");
  const [kraPin, setKraPin] = useState(profile.kra_pin || "");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [ownershipFile, setOwnershipFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const status = profile.kyc_status || "unverified";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !phoneNumber.trim() || !kraPin.trim()) {
      setError("Full legal name, phone number, and KRA PIN are required.");
      return;
    }

    if (!idFile && !profile.id_doc_url) {
      setError("Please upload a clear photo or PDF of your Kenyan National ID.");
      return;
    }

    if (!ownershipFile && !profile.ownership_doc_url) {
      setError(
        "Please upload proof of ownership or caretaker authorization letter."
      );
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      let idDocPath = profile.id_doc_url;
      let ownershipDocPath = profile.ownership_doc_url;

      if (idFile) {
        const ext = idFile.name.split(".").pop() || "jpg";
        const path = `${profile.id}/national-id-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("kyc-docs")
          .upload(path, idFile, { upsert: true });

        if (uploadErr) {
          throw new Error(`ID upload failed: ${uploadErr.message}`);
        }
        idDocPath = path;
      }

      if (ownershipFile) {
        const ext = ownershipFile.name.split(".").pop() || "pdf";
        const path = `${profile.id}/ownership-doc-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("kyc-docs")
          .upload(path, ownershipFile, { upsert: true });

        if (uploadErr) {
          throw new Error(`Ownership doc upload failed: ${uploadErr.message}`);
        }
        ownershipDocPath = path;
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          role: profile.role === "admin" ? "admin" : "manager",
          kra_pin: kraPin.trim().toUpperCase(),
          id_doc_url: idDocPath,
          ownership_doc_url: ownershipDocPath,
          kyc_status: "pending",
        })
        .eq("id", profile.id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      setSuccess(
        "KYC documents submitted! Your manager verification is now under review."
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit KYC details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Status Banner */}
      <div className="rounded-2xl border border-subtle bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Landlord & Caretaker KYC Status
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-ink">
              {status === "verified"
                ? "Verified Property Partner"
                : status === "pending"
                ? "Verification Under Review"
                : status === "rejected"
                ? "Action Required on KYC Submission"
                : "Complete Identity Verification"}
            </h2>
          </div>

          {status === "verified" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-brand/15 px-3.5 py-1.5 text-xs font-extrabold text-emerald-brand">
              <BadgeCheck className="h-4 w-4" /> Verified
            </span>
          )}
          {status === "pending" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-featured/15 px-3.5 py-1.5 text-xs font-extrabold text-amber-featured">
              <Clock className="h-4 w-4" /> Pending Review
            </span>
          )}
          {status === "rejected" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-3.5 py-1.5 text-xs font-extrabold text-danger">
              <ShieldAlert className="h-4 w-4" /> Rejected
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-ink-secondary">
          Every caretaker and landlord on propertyaccess.app undergoes ID and
          property authority screening to keep the platform 100% broker-free.
        </p>

        {profile.kyc_notes && (
          <div className="mt-3 rounded-xl border border-amber-featured/30 bg-amber-featured/10 p-3 text-xs text-ink">
            <strong>Reviewer Note:</strong> {profile.kyc_notes}
          </div>
        )}
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-subtle bg-card p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink">
              Full Legal Name (as on National ID)
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="David Mbate Blessing"
              className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink">
              Primary Safaricom Phone
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0711431522"
              className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-brand"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink">
            KRA PIN Number
          </label>
          <input
            type="text"
            required
            value={kraPin}
            onChange={(e) => setKraPin(e.target.value.toUpperCase())}
            placeholder="A001234567Z"
            maxLength={11}
            className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm uppercase text-ink outline-none focus:border-emerald-brand"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* National ID Upload */}
          <label className="flex cursor-pointer flex-col justify-between rounded-xl border border-dashed border-subtle bg-canvas p-4 transition hover:border-emerald-brand">
            <div className="flex items-start gap-2.5">
              <Upload className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
              <div>
                <p className="text-xs font-extrabold text-ink">
                  Kenyan National ID / Passport
                </p>
                <p className="mt-0.5 text-[11px] text-ink-secondary">
                  {idFile
                    ? idFile.name
                    : profile.id_doc_url
                    ? "Document already on file (tap to replace)"
                    : "JPG, PNG, or PDF (Max 5MB)"}
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {/* Ownership / Caretaker Authority Upload */}
          <label className="flex cursor-pointer flex-col justify-between rounded-xl border border-dashed border-subtle bg-canvas p-4 transition hover:border-emerald-brand">
            <div className="flex items-start gap-2.5">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
              <div>
                <p className="text-xs font-extrabold text-ink">
                  Title Deed / Utility Bill / Authority Letter
                </p>
                <p className="mt-0.5 text-[11px] text-ink-secondary">
                  {ownershipFile
                    ? ownershipFile.name
                    : profile.ownership_doc_url
                    ? "Document already on file (tap to replace)"
                    : "Proof you manage or own the property"}
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setOwnershipFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-brand/30 bg-emerald-brand/10 p-3 text-xs text-emerald-brand">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-brand py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-hover disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading & Saving...
            </>
          ) : status === "unverified" ? (
            "Submit KYC for Verification"
          ) : (
            "Update KYC Documents"
          )}
        </button>
      </form>
    </div>
  );
}

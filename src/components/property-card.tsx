"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Heart,
  MapPin,
  Maximize2,
  Orbit,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ListingItem } from "@/types/property";

interface PropertyCardProps {
  listing: ListingItem;
  initialSaved?: boolean;
  isLoggedIn?: boolean;
  featured?: boolean;
}

export function PropertyCard({
  listing,
  initialSaved = false,
  isLoggedIn = false,
  featured = false,
}: PropertyCardProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  const coverPhoto =
    listing.listing_media?.find((m) => m.media_type === "photo")?.public_url ||
    listing.listing_media?.[0]?.public_url;

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (saving) return;
    setSaving(true);

    const nextSaved = !saved;
    setSaved(nextSaved);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaved(!nextSaved);
      setSaving(false);
      router.push("/login");
      return;
    }

    if (nextSaved) {
      const { error } = await supabase
        .from("saved_listings")
        .insert({ user_id: user.id, listing_id: listing.id });
      if (error) setSaved(false);
    } else {
      const { error } = await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listing.id);
      if (error) setSaved(true);
    }

    setSaving(false);
  };

  const priceSuffix =
    listing.category === "rent"
      ? "/ mo"
      : listing.category === "auction"
      ? "guide"
      : "";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:border-emerald-brand/60 ${
        featured
          ? "min-w-[285px] max-w-[310px] shrink-0 snap-start border-amber-featured/40 sm:min-w-[320px]"
          : "border-subtle"
      }`}
    >
      {/* Image / Visual Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted-surface">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-brand/15 via-muted-surface to-card p-4 text-center">
            <span className="rounded-full border border-emerald-brand/30 bg-emerald-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-brand">
              {listing.archetype}
            </span>
            <p className="mt-2 line-clamp-1 text-xs font-semibold text-ink-secondary">
              {listing.neighborhood}, {listing.county}
            </p>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-brand px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            <BadgeCheck className="h-3 w-3" />
            Verified Direct
          </span>

          {listing.has_3d_tour && (
            <span className="inline-flex items-center gap-1 rounded-full bg-canvas/90 px-2.5 py-1 text-[10px] font-bold text-ink backdrop-blur-sm">
              <Orbit className="h-3 w-3 text-emerald-brand" />
              360°
            </span>
          )}

          {listing.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-featured px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-950">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>

        {/* Save / Heart Button */}
        <button
          type="button"
          onClick={toggleSave}
          aria-label={saved ? "Remove from saved" : "Save listing"}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/85 text-ink backdrop-blur-sm transition hover:scale-105"
        >
          <Heart
            className={`h-4 w-4 ${
              saved ? "fill-danger text-danger" : "text-ink"
            }`}
          />
        </button>

        {/* Vacant Units Pill */}
        {listing.category === "rent" && listing.vacant_units > 0 && (
          <span className="absolute bottom-2.5 left-3 rounded-lg bg-canvas/90 px-2 py-0.5 text-[10px] font-bold text-ink backdrop-blur-sm">
            {listing.vacant_units}{" "}
            {listing.vacant_units === 1 ? "unit vacant" : "units vacant"}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-lg font-extrabold tracking-tight text-ink">
              KES {Number(listing.price_kes).toLocaleString()}
              {priceSuffix && (
                <span className="ml-1 text-xs font-medium text-ink-secondary">
                  {priceSuffix}
                </span>
              )}
            </p>
            {listing.unit_tag && (
              <span className="rounded-md bg-muted-surface px-2 py-0.5 text-[10px] font-bold text-ink-secondary">
                {listing.unit_tag}
              </span>
            )}
          </div>

          <h3 className="mt-1 line-clamp-1 text-sm font-bold text-ink group-hover:text-emerald-brand">
            {listing.title}
          </h3>

          <p className="mt-1 flex items-center gap-1 text-xs text-ink-secondary">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-brand" />
            <span className="line-clamp-1">
              {listing.neighborhood}
              {listing.landmark ? ` • Near ${listing.landmark}` : ""}
            </span>
          </p>
        </div>

        {/* Specs + Zero Broker Footer */}
        <div className="mt-3.5 border-t border-subtle pt-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-secondary">
            <div className="flex items-center gap-3">
              {listing.category !== "land" && (
                <>
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5 text-ink-muted" />
                    {listing.archetype === "bedsitter"
                      ? "Studio"
                      : `${listing.bedrooms ?? 1} Bed`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5 text-ink-muted" />
                    {listing.bathrooms ?? 1} Bath
                  </span>
                </>
              )}
              {listing.area_sqm && (
                <span className="inline-flex items-center gap-1">
                  <Maximize2 className="h-3.5 w-3.5 text-ink-muted" />
                  {listing.area_sqm} sqm
                </span>
              )}
            </div>

            <span className="font-bold text-emerald-brand">Zero Broker</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

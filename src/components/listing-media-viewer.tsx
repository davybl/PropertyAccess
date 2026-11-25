"use client";

import { useRef, useState } from "react";
import {
  Compass,
  Image as ImageIcon,
  Layers,
  MoveHorizontal,
  Orbit,
} from "lucide-react";
import type { ListingMediaItem } from "@/types/property";

interface ListingMediaViewerProps {
  title: string;
  archetype: string;
  neighborhood: string;
  county: string;
  has3dTour: boolean;
  tour360Url: string | null;
  media: ListingMediaItem[];
}

export function ListingMediaViewer({
  title,
  archetype,
  neighborhood,
  county,
  has3dTour,
  tour360Url,
  media,
}: ListingMediaViewerProps) {
  const photos = media.filter((m) => m.media_type === "photo");
  const panoramas = media.filter((m) => m.media_type === "panorama_360");
  const floorplans = media.filter((m) => m.media_type === "floorplan");

  const [activeTab, setActiveTab] = useState<"photos" | "360" | "floorplan">(
    "photos"
  );
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  // Interactive drag-to-pan state for 360° panorama images
  const [panOffset, setPanOffset] = useState(50);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  const active360Image = panoramas[0]?.public_url || tour360Url;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    startXRef.current = e.clientX;
    setPanOffset((prev) => Math.max(0, Math.min(100, prev - deltaX * 0.25)));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-subtle bg-card">
      {/* Top Mode Switcher Bar (Photos / 360° Tour / Floorplan) */}
      <div className="flex items-center justify-between gap-2 border-b border-subtle bg-muted-surface/50 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "photos"
                ? "bg-emerald-brand text-white shadow-sm"
                : "text-ink-secondary hover:bg-card hover:text-ink"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Photos ({photos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("360")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "360"
                ? "bg-emerald-brand text-white shadow-sm"
                : "text-ink-secondary hover:bg-card hover:text-ink"
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            <span>360° Tour</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("floorplan")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "floorplan"
                ? "bg-emerald-brand text-white shadow-sm"
                : "text-ink-secondary hover:bg-card hover:text-ink"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Floorplan</span>
          </button>
        </div>

        {(has3dTour || active360Image) && (
          <span className="hidden items-center gap-1 rounded-full bg-emerald-brand/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-brand sm:inline-flex">
            <Compass className="h-3 w-3" />
            3D Verified
          </span>
        )}
      </div>

      {/* TAB 1: PHOTOS */}
      {activeTab === "photos" && (
        <div>
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted-surface">
            {photos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[selectedPhotoIdx]?.public_url}
                alt={photos[selectedPhotoIdx]?.caption || title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-brand/15 via-muted-surface to-card p-6 text-center">
                <span className="rounded-full border border-emerald-brand/30 bg-emerald-brand/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-brand">
                  {archetype}
                </span>
                <p className="mt-3 text-base font-bold text-ink">{title}</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  {neighborhood}, {county} • Photos pending manager upload
                </p>
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-subtle p-3">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(idx)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    idx === selectedPhotoIdx
                      ? "border-emerald-brand"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.public_url}
                    alt={photo.caption || `Photo ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 360° PANORAMA VIEWER */}
      {activeTab === "360" && (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted-surface">
          {active360Image ? (
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative h-full w-full cursor-grab select-none active:cursor-grabbing"
              style={{
                backgroundImage: `url(${active360Image})`,
                backgroundSize: "220% 100%",
                backgroundPosition: `${panOffset}% center`,
              }}
            >
              <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-canvas/90 px-3.5 py-1.5 text-[11px] font-bold text-ink backdrop-blur-sm">
                <MoveHorizontal className="h-3.5 w-3.5 text-emerald-brand" />
                Drag left or right to look around 360°
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
              <Orbit className="h-9 w-9 text-emerald-brand" />
              <p className="mt-2.5 text-sm font-bold text-ink">
                {has3dTour
                  ? "360° Walkthrough Scheduled"
                  : "Standard Photo Listing"}
              </p>
              <p className="mt-1 max-w-sm text-xs text-ink-secondary">
                {has3dTour
                  ? "Our 3D concierge capture is queued for this unit. You can still unlock the caretaker contact below to book a physical viewing today."
                  : "This property currently uses verified photos. Unlock the caretaker below for a direct visit."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FLOORPLAN */}
      {activeTab === "floorplan" && (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted-surface">
          {floorplans.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={floorplans[0].public_url}
              alt={floorplans[0].caption || "Unit Floorplan"}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
              <Layers className="h-8 w-8 text-ink-muted" />
              <p className="mt-2 text-sm font-bold text-ink">
                No architectural floorplan attached
              </p>
              <p className="mt-1 text-xs text-ink-secondary">
                Check the room dimensions and specifications listed below.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

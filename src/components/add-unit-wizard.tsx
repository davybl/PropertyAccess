"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Compass,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { KENYA_LOCATIONS, type KenyaCity } from "@/data/kenya-locations";
import type { PropertyCategory } from "@/types/property";
import type { ManagerBuildingRow } from "@/components/manager-dashboard-client";

interface AddUnitWizardProps {
  managerId: string;
  defaultCaretakerName: string;
  defaultCaretakerPhone: string;
  buildings: ManagerBuildingRow[];
}

interface PendingMediaFile {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: "photo" | "panorama_360" | "floorplan";
  caption: string;
}

const KENYAN_AMENITIES = [
  "24/7 Borehole Water",
  "Prepaid Token Meter",
  "Safaricom Fiber Ready",
  "CCTV & 24/7 Guard",
  "Cabro Parking",
  "Private Balcony",
  "Solar Water Heater",
  "Tiled Floors",
  "Perimeter Wall & Electric Fence",
  "Freehold Title Deed",
  "Close to Tarmac / Stage",
];

export function AddUnitWizard({
  managerId,
  defaultCaretakerName,
  defaultCaretakerPhone,
  buildings,
}: AddUnitWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Category, Archetype, Building & Location
  const [category, setCategory] = useState<PropertyCategory>("rent");
  const [archetype, setArchetype] = useState<
    "apartment" | "bedsitter" | "plot" | "auction"
  >("apartment");
  const [buildingId, setBuildingId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [unitTag, setUnitTag] = useState("");
  const [county, setCounty] = useState<KenyaCity["city"]>("Nairobi");
  const [neighborhood, setNeighborhood] = useState("");
  const [landmark, setLandmark] = useState("");
  const [customLandmark, setCustomLandmark] = useState("");

  // Step 2: Pricing, Specs & Amenities
  const [priceKes, setPriceKes] = useState("");
  const [depositKes, setDepositKes] = useState("");
  const [depositTerms, setDepositTerms] = useState("1 Month Rent Deposit");
  const [vacantUnits, setVacantUnits] = useState("1");
  const [moveInAvailability, setMoveInAvailability] = useState("Immediate");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [areaSqm, setAreaSqm] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "24/7 Borehole Water",
    "Prepaid Token Meter",
  ]);
  const [description, setDescription] = useState("");

  // Step 3: Media & 360° / Concierge
  const [mediaFiles, setMediaFiles] = useState<PendingMediaFile[]>([]);
  const [tour360Url, setTour360Url] = useState("");
  const [concierge3dRequested, setConcierge3dRequested] = useState(false);
  const [conciergeWindow, setConciergeWindow] = useState(
    "Weekdays 10:00 AM – 2:00 PM"
  );

  // Step 4: Direct Caretaker Contact Vault
  const [caretakerName, setCaretakerName] = useState(defaultCaretakerName);
  const [caretakerRole, setCaretakerRole] = useState("Caretaker");
  const [caretakerPhone, setCaretakerPhone] = useState(defaultCaretakerPhone);
  const [sameWhatsapp, setSameWhatsapp] = useState(true);
  const [whatsappPhone, setWhatsappPhone] = useState(defaultCaretakerPhone);

  const selectedCity = KENYA_LOCATIONS.find((item) => item.city === county);
  const selectedNeighborhood = selectedCity?.neighborhoods.find(
    (item) => item.name === neighborhood
  );

  const handleSelectBuilding = (selectedId: string) => {
    const found = buildings.find((b) => b.id === selectedId);
    if (!found) {
      setBuildingId("");
      return;
    }

    const city = KENYA_LOCATIONS.find((item) => item.city === found.county);
    const matchingNeighborhood = city?.neighborhoods.find(
      (item) => item.name === found.neighborhood
    );
    if (!city || !matchingNeighborhood) {
      setBuildingId("");
      setError("Choose a building with a supported city and neighborhood.");
      return;
    }

    setBuildingId(selectedId);
    setCounty(city.city);
    setNeighborhood(matchingNeighborhood.name);
    const matchingLandmark = matchingNeighborhood.landmarks.includes(
      found.landmark ?? ""
    )
      ? found.landmark ?? ""
      : found.landmark
      ? "Other / Custom"
      : "";
    setLandmark(matchingLandmark);
    setCustomLandmark(
      matchingLandmark === "Other / Custom" ? found.landmark ?? "" : ""
    );
  };

  const toggleAmenity = (label: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const added: PendingMediaFile[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      mediaType: "photo",
      caption: "",
    }));
    setMediaFiles((prev) => [...prev, ...added]);
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((m) => m.id !== id);
    });
  };

  const validateStep = (current: 1 | 2 | 3 | 4): boolean => {
    setError(null);
    if (current === 1) {
      if (!title.trim() || !neighborhood.trim()) {
        setError("Please enter a listing title and neighborhood.");
        return false;
      }
      if (landmark === "Other / Custom" && !customLandmark.trim()) {
        setError("Enter a custom nearby landmark.");
        return false;
      }
    }
    if (current === 2) {
      if (!priceKes || Number(priceKes) <= 0) {
        setError("Enter a valid price in KES.");
        return false;
      }
    }
    return true;
  };

  const handlePublish = async () => {
    setError(null);
    if (!caretakerName.trim() || !caretakerPhone.trim()) {
      setError("Caretaker name and phone number are required.");
      return;
    }

    setPublishing(true);
    const supabase = createClient();

    try {
      const has360 =
        Boolean(tour360Url.trim()) ||
        mediaFiles.some((m) => m.mediaType === "panorama_360");

      const isPlotOrLand = category === "land" || archetype === "plot";

      const { data: createdListing, error: listingErr } = await supabase
        .from("listings")
        .insert({
          building_id: buildingId || null,
          manager_id: managerId,
          category,
          archetype,
          title: title.trim(),
          unit_tag: unitTag.trim() || null,
          description: description.trim() || null,
          price_kes: Math.round(Number(priceKes)),
          deposit_kes: depositKes ? Math.round(Number(depositKes)) : null,
          deposit_terms:
            category === "rent" ? depositTerms.trim() || null : null,
          vacant_units: Math.max(1, Math.round(Number(vacantUnits) || 1)),
          move_in_availability: moveInAvailability.trim() || "Immediate",
          bedrooms: isPlotOrLand ? null : Number(bedrooms || 0),
          bathrooms: isPlotOrLand ? null : Number(bathrooms || 1),
          area_sqm: areaSqm ? Math.round(Number(areaSqm)) : null,
          amenities: selectedAmenities,
          county: county.trim(),
          neighborhood: neighborhood.trim(),
          landmark:
            (landmark === "Other / Custom" ? customLandmark : landmark).trim() ||
            null,
          has_3d_tour: has360,
          tour_360_url: tour360Url.trim() || null,
          concierge_3d_requested: concierge3dRequested,
          concierge_window: concierge3dRequested ? conciergeWindow : null,
          status: "active",
        })
        .select("id")
        .single();

      if (listingErr || !createdListing) {
        throw new Error(listingErr?.message || "Failed to create listing.");
      }

      const newListingId = createdListing.id;

      // Insert locked caretaker contact record
      const finalWhatsapp = sameWhatsapp
        ? caretakerPhone.trim()
        : whatsappPhone.trim() || caretakerPhone.trim();

      const { error: contactErr } = await supabase
        .from("listing_contacts")
        .insert({
          listing_id: newListingId,
          caretaker_name: caretakerName.trim(),
          caretaker_role: caretakerRole,
          caretaker_phone: caretakerPhone.trim(),
          whatsapp_phone: finalWhatsapp,
        });

      if (contactErr) {
        throw new Error(`Contact vault error: ${contactErr.message}`);
      }

      // Upload photos / 360 panoramas to listing-media bucket
      for (let i = 0; i < mediaFiles.length; i++) {
        const item = mediaFiles[i];
        const ext = item.file.name.split(".").pop() || "jpg";
        const storagePath = `${managerId}/${newListingId}/${i}-${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("listing-media")
          .upload(storagePath, item.file, { upsert: true });

        if (uploadErr) {
          throw new Error(`Media upload failed: ${uploadErr.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("listing-media")
          .getPublicUrl(storagePath);

        await supabase.from("listing_media").insert({
          listing_id: newListingId,
          media_type: item.mediaType,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          caption: item.caption.trim() || null,
          sort_order: i,
        });
      }

      router.push(`/listings/${newListingId}`);
      router.refresh();
    } catch (err) {
      setPublishing(false);
      setError(
        err instanceof Error ? err.message : "Could not publish property."
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-28 md:pb-12">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/manager"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-secondary hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Manager Hub
        </Link>
        <span className="font-mono text-xs font-extrabold text-emerald-brand">
          Step {step} of 4
        </span>
      </div>

      {/* Step Progress Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((num) => (
          <div
            key={num}
            className={`h-1.5 rounded-full transition ${
              num <= step ? "bg-emerald-brand" : "bg-muted-surface"
            }`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-subtle bg-card p-5 shadow-sm sm:p-6">
        {/* STEP 1: CATEGORY & LOCATION */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-extrabold text-ink">
                1. Property Category & Location
              </h1>
              <p className="text-xs text-ink-secondary">
                Choose the pass category and where tenants will find this unit.
              </p>
            </div>

            {/* Category Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">
                Listing Category
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["rent", "buy", "land", "auction"] as PropertyCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        if (cat === "land") setArchetype("plot");
                        if (cat === "auction") setArchetype("auction");
                        if (cat === "rent" || cat === "buy")
                          setArchetype("apartment");
                      }}
                      className={`rounded-xl border py-2.5 text-xs font-extrabold uppercase transition ${
                        category === cat
                          ? "border-emerald-brand bg-emerald-brand/15 text-emerald-brand"
                          : "border-subtle bg-canvas text-ink-secondary hover:text-ink"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Archetype Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">
                Property Archetype
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  ["apartment", "bedsitter", "plot", "auction"] as const
                ).map((arch) => (
                  <button
                    key={arch}
                    type="button"
                    onClick={() => setArchetype(arch)}
                    className={`rounded-xl border py-2 text-xs font-bold capitalize transition ${
                      archetype === arch
                        ? "border-emerald-brand bg-emerald-brand/15 text-emerald-brand"
                        : "border-subtle bg-canvas text-ink-secondary hover:text-ink"
                    }`}
                  >
                    {arch}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Building Link */}
            {buildings.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Link to Registered Building (Optional)
                </label>
                <select
                  value={buildingId}
                  onChange={(e) => handleSelectBuilding(e.target.value)}
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-xs font-semibold text-ink outline-none focus:border-emerald-brand"
                >
                  <option value="">Standalone Listing (No Building)</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.building_code ? `(${b.building_code})` : ""} —{" "}
                      {b.neighborhood}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Listing Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Spacious 1-Bedroom Apartment with Balcony"
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Unit / Plot Tag
                </label>
                <input
                  type="text"
                  value={unitTag}
                  onChange={(e) => setUnitTag(e.target.value)}
                  placeholder="House B4"
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-brand"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  City
                </label>
                <select
                  value={county}
                  onChange={(e) => {
                    const city = KENYA_LOCATIONS.find(
                      (item) => item.city === e.target.value
                    );
                    if (!city) return;
                    setCounty(city.city);
                    setNeighborhood("");
                    setLandmark("");
                    setCustomLandmark("");
                  }}
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
                >
                  {KENYA_LOCATIONS.map((item) => (
                    <option key={item.city} value={item.city}>
                      {item.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Neighborhood / Estate
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => {
                    setNeighborhood(e.target.value);
                    setLandmark("");
                    setCustomLandmark("");
                  }}
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
                >
                  <option value="">Select a neighborhood</option>
                  {selectedCity?.neighborhoods.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">
                Nearest Landmark (Helps tenants locate easily)
              </label>
              <select
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                disabled={!selectedNeighborhood}
                className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand disabled:opacity-60"
              >
                <option value="">Select a landmark (optional)</option>
                {selectedNeighborhood?.landmarks.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                {selectedNeighborhood && (
                  <option value="Other / Custom">Other / Custom</option>
                )}
              </select>
              {landmark === "Other / Custom" && (
                <input
                  type="text"
                  value={customLandmark}
                  onChange={(e) => setCustomLandmark(e.target.value)}
                  placeholder="Enter a nearby landmark"
                  className="mt-2 w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 2: PRICING, SPECS & AMENITIES */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-extrabold text-ink">
                2. Pricing, Specs & Amenities
              </h1>
              <p className="text-xs text-ink-secondary">
                Transparent pricing builds instant trust with serious tenants
                and buyers.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  {category === "rent" ? "Monthly Rent (KES)" : "Price (KES)"}
                </label>
                <input
                  type="number"
                  min={1}
                  value={priceKes}
                  onChange={(e) => setPriceKes(e.target.value)}
                  placeholder="14000"
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm font-bold text-ink outline-none focus:border-emerald-brand"
                />
              </div>

              {category === "rent" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Deposit Amount (KES)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={depositKes}
                    onChange={(e) => setDepositKes(e.target.value)}
                    placeholder="14000"
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-brand"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Area (Sqm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    placeholder="450"
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-brand"
                  />
                </div>
              )}
            </div>

            {category === "rent" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Deposit Terms
                  </label>
                  <input
                    type="text"
                    value={depositTerms}
                    onChange={(e) => setDepositTerms(e.target.value)}
                    placeholder="1 Month + Water Deposit"
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-xs text-ink outline-none focus:border-emerald-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Vacant Units Available
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={vacantUnits}
                    onChange={(e) => setVacantUnits(e.target.value)}
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-xs font-bold text-ink outline-none focus:border-emerald-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Move-In Date
                  </label>
                  <input
                    type="text"
                    value={moveInAvailability}
                    onChange={(e) => setMoveInAvailability(e.target.value)}
                    placeholder="Immediate"
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-xs text-ink outline-none focus:border-emerald-brand"
                  />
                </div>
              </div>
            )}

            {category !== "land" && archetype !== "plot" && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Bedrooms (0 = Studio/Bedsitter)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-brand"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink">
                    Size (Sqm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    placeholder="45"
                    className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-brand"
                  />
                </div>
              </div>
            )}

            {/* Amenities Chips */}
            <div>
              <label className="mb-2 block text-xs font-bold text-ink">
                Features & Utilities
              </label>
              <div className="flex flex-wrap gap-2">
                {KENYAN_AMENITIES.map((amenity) => {
                  const active = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                        active
                          ? "border-emerald-brand bg-emerald-brand/15 text-emerald-brand"
                          : "border-subtle bg-canvas text-ink-secondary hover:text-ink"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">
                Additional Unit Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention water schedule, floor level, viewing hours, or title deed status..."
                className="w-full rounded-xl border border-subtle bg-canvas p-3 text-xs text-ink outline-none focus:border-emerald-brand"
              />
            </div>
          </div>
        )}

        {/* STEP 3: PHOTOS & 360° TOUR */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-extrabold text-ink">
                3. Photos & 360° Virtual Walkthrough
              </h1>
              <p className="text-xs text-ink-secondary">
                Upload clear photos or equirectangular 360° panoramas so
                tenants can inspect before visiting.
              </p>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-subtle bg-canvas p-6 text-center transition hover:border-emerald-brand">
              <Camera className="h-8 w-8 text-emerald-brand" />
              <p className="mt-2 text-xs font-extrabold text-ink">
                Tap to Select Photos or 360° Panoramas
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                JPG, PNG, or WebP from phone gallery or camera
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleAddFiles(e.target.files)}
                className="hidden"
              />
            </label>

            {mediaFiles.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {mediaFiles.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-subtle bg-canvas p-2.5"
                  >
                    <div className="relative h-28 w-full overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeMediaFile(item.id)}
                        aria-label="Remove image"
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white hover:bg-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <select
                        value={item.mediaType}
                        onChange={(e) =>
                          setMediaFiles((prev) =>
                            prev.map((m) =>
                              m.id === item.id
                                ? {
                                    ...m,
                                    mediaType: e.target.value as
                                      | "photo"
                                      | "panorama_360"
                                      | "floorplan",
                                  }
                                : m
                            )
                          )
                        }
                        className="rounded-lg border border-subtle bg-card px-2 py-1 text-[11px] font-bold text-ink"
                      >
                        <option value="photo">Standard Photo</option>
                        <option value="panorama_360">360° Panorama</option>
                        <option value="floorplan">Floorplan / Map</option>
                      </select>

                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) =>
                          setMediaFiles((prev) =>
                            prev.map((m) =>
                              m.id === item.id
                                ? { ...m, caption: e.target.value }
                                : m
                            )
                          )
                        }
                        placeholder="Caption (e.g. Living Room)"
                        className="min-w-0 flex-1 rounded-lg border border-subtle bg-card px-2 py-1 text-[11px] text-ink"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* External 360 Tour URL */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-ink">
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                External 360° / Matterport Tour Link (Optional)
              </label>
              <input
                type="url"
                value={tour360Url}
                onChange={(e) => setTour360Url(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2 text-xs text-ink outline-none focus:border-emerald-brand"
              />
            </div>

            {/* Free 3D Concierge Capture Request */}
            <div className="rounded-xl border border-amber-featured/30 bg-amber-featured/10 p-3.5">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={concierge3dRequested}
                  onChange={(e) => setConcierge3dRequested(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-emerald-600"
                />
                <div className="text-xs">
                  <p className="font-extrabold text-ink">
                    <Sparkles className="mr-1 inline h-3.5 w-3.5 text-amber-featured" />
                    Request Free 360° Camera Capture
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-secondary">
                    Our field team captures a full 360° room tour on site to
                    boost your unit&apos;s unlock rate.
                  </p>
                </div>
              </label>

              {concierge3dRequested && (
                <input
                  type="text"
                  value={conciergeWindow}
                  onChange={(e) => setConciergeWindow(e.target.value)}
                  placeholder="Preferred day & time window"
                  className="mt-2.5 w-full rounded-lg border border-subtle bg-card px-3 py-2 text-xs text-ink"
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 4: CARETAKER CONTACT VAULT & PUBLISH */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-extrabold text-ink">
                4. Direct Caretaker Contact Vault
              </h1>
              <p className="text-xs text-ink-secondary">
                Protected behind Row-Level Security—revealed only to verified
                7-Day Pass holders.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Caretaker / Owner Name
                </label>
                <input
                  type="text"
                  required
                  value={caretakerName}
                  onChange={(e) => setCaretakerName(e.target.value)}
                  placeholder="e.g. Samuel Kamau"
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  Role on Property
                </label>
                <select
                  value={caretakerRole}
                  onChange={(e) => setCaretakerRole(e.target.value)}
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-brand"
                >
                  <option value="Caretaker">Caretaker</option>
                  <option value="Landlord / Owner">Landlord / Owner</option>
                  <option value="Property Manager">Property Manager</option>
                  <option value="Auctioneer">Auctioneer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink">
                Direct Call Number
              </label>
              <input
                type="tel"
                required
                value={caretakerPhone}
                onChange={(e) => setCaretakerPhone(e.target.value)}
                placeholder="0711431522"
                className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm font-bold text-ink outline-none focus:border-emerald-brand"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-ink">
              <input
                type="checkbox"
                checked={sameWhatsapp}
                onChange={(e) => setSameWhatsapp(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              WhatsApp number is the same as direct call number
            </label>

            {!sameWhatsapp && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="0711431522"
                  className="w-full rounded-xl border border-subtle bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus:border-emerald-brand"
                />
              </div>
            )}

            {/* Quick Pre-Publish Summary */}
            <div className="rounded-xl border border-subtle bg-muted-surface/60 p-4 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-emerald-brand">
                <Building2 className="h-4 w-4" />
                Ready to Publish
              </div>
              <p className="mt-1 font-bold text-ink">{title}</p>
              <p className="text-ink-secondary">
                {neighborhood}, {county} • KES{" "}
                {Number(priceKes || 0).toLocaleString()} • {mediaFiles.length}{" "}
                media file(s)
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Footer Buttons */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-subtle pt-4">
          {step > 1 ? (
            <button
              type="button"
              disabled={publishing}
              onClick={() => {
                setError(null);
                setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-canvas px-4 py-2.5 text-xs font-extrabold text-ink hover:border-emerald-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (validateStep(step)) {
                  setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-brand px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-hover"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-brand px-6 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-hover disabled:opacity-60"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing Unit...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Publish Property Live
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

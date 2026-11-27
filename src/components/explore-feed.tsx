"use client";

import { useMemo, useState } from "react";
import { Building2, Gavel, Home, Landmark, Search, Sparkles } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import { ALL_NEIGHBORHOODS, KENYA_LOCATIONS } from "@/data/kenya-locations";
import type { ListingItem, PropertyCategory } from "@/types/property";

interface ExploreFeedProps {
  listings: ListingItem[];
  savedIds: string[];
  isLoggedIn: boolean;
}

const CATEGORIES: {
  id: PropertyCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "rent", label: "Rent", icon: Home },
  { id: "buy", label: "Buy", icon: Building2 },
  { id: "land", label: "Land", icon: Landmark },
  { id: "auction", label: "Auctions", icon: Gavel },
];

export function ExploreFeed({
  listings,
  savedIds,
  isLoggedIn,
}: ExploreFeedProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<PropertyCategory>("rent");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedArea, setSelectedArea] = useState<string>("All Areas");
  const [searchQuery, setSearchQuery] = useState("");

  const availableNeighborhoods =
    selectedCity === "All Cities"
      ? ALL_NEIGHBORHOODS
      : ALL_NEIGHBORHOODS.filter(
          (neighborhood) => neighborhood.city === selectedCity
        );

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<PropertyCategory, number> = {
      rent: 0,
      buy: 0,
      land: 0,
      auction: 0,
    };
    for (const item of listings) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [listings]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listings.filter((item) => {
      if (item.category !== selectedCategory) return false;
      if (
        selectedCity !== "All Cities" &&
        item.county.trim().replace(/\s+county$/i, "").toLowerCase() !==
          selectedCity.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedArea !== "All Areas" &&
        item.neighborhood.toLowerCase() !== selectedArea.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.neighborhood.toLowerCase().includes(q) ||
        (item.landmark && item.landmark.toLowerCase().includes(q)) ||
        item.county.toLowerCase().includes(q)
      );
    });
  }, [listings, selectedCategory, selectedCity, selectedArea, searchQuery]);

  const featuredListings = useMemo(
    () => filteredListings.filter((item) => item.is_featured),
    [filteredListings]
  );

  return (
    <div className="space-y-6">
      {/* Hero Search + Category Switcher */}
      <section className="rounded-2xl border border-subtle bg-card p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Direct Caretaker Listings
            </h1>
            <p className="mt-0.5 text-xs text-ink-secondary">
              Verified landlords &amp; caretakers only • KES 200 unlocks 7 days of contacts
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="sr-only" htmlFor="explore-city">
              Filter by city
            </label>
            <select
              id="explore-city"
              value={selectedCity}
              onChange={(event) => {
                setSelectedCity(event.target.value);
                setSelectedArea("All Areas");
              }}
              className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-emerald-brand sm:w-36"
            >
              <option value="All Cities">All Cities</option>
              {KENYA_LOCATIONS.map((item) => (
                <option key={item.city} value={item.city}>
                  {item.city}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search estate, landmark..."
                className="w-full rounded-xl border border-subtle bg-canvas py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-brand"
              />
            </div>
          </div>
        </div>

        {/* 4-Category Switcher Pills (code3.html & code6.html) */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                  active
                    ? "border-emerald-brand bg-emerald-brand text-white shadow-sm"
                    : "border-subtle bg-canvas text-ink-secondary hover:border-ink-muted hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                <span
                  className={`hidden rounded-full px-1.5 py-0.2 text-[10px] sm:inline ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-muted-surface text-ink-muted"
                  }`}
                >
                  {categoryCounts[cat.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Neighborhood Jump Chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["All Areas", ...availableNeighborhoods.map((item) => item.name)].map((area) => {
            const active = selectedArea === area;
            return (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(area)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-brand bg-emerald-brand/15 text-emerald-brand"
                    : "border-subtle bg-canvas text-ink-secondary hover:border-ink-muted"
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Carousel (Amber Accent per DESIGN_2.md) */}
      {featuredListings.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-featured" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink">
                Featured Buildings &amp; Deals
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-ink-muted">
              Swipe →
            </span>
          </div>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {featuredListings.map((item) => (
              <PropertyCard
                key={`feat-${item.id}`}
                listing={item}
                initialSaved={savedSet.has(item.id)}
                isLoggedIn={isLoggedIn}
                featured
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Verified Feed Grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink">
            Verified {selectedCategory} Listings ({filteredListings.length})
          </h2>
          {selectedArea !== "All Areas" && (
            <button
              type="button"
              onClick={() => setSelectedArea("All Areas")}
              className="text-xs font-bold text-emerald-brand hover:underline"
            >
              Reset area filter
            </button>
          )}
        </div>

        {filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-subtle bg-card p-10 text-center">
            <p className="text-sm font-bold text-ink">
              No active listings in this filter yet
            </p>
            <p className="mt-1 text-xs text-ink-secondary">
              Switch categories above or clear your neighborhood filter to browse all verified properties.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((item) => (
              <PropertyCard
                key={item.id}
                listing={item}
                initialSaved={savedSet.has(item.id)}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

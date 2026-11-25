export type PropertyCategory = "rent" | "buy" | "land" | "auction";

export interface ListingMediaItem {
  id: string;
  media_type: "photo" | "panorama_360" | "floorplan";
  public_url: string;
  caption: string | null;
  sort_order: number;
}

export interface ListingItem {
  id: string;
  category: PropertyCategory;
  archetype: "apartment" | "bedsitter" | "plot" | "auction";
  title: string;
  unit_tag: string | null;
  price_kes: number;
  deposit_kes: number | null;
  vacant_units: number;
  move_in_availability: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  amenities: string[];
  county: string;
  neighborhood: string;
  landmark: string | null;
  is_featured: boolean;
  has_3d_tour: boolean;
  status: string;
  listing_media?: ListingMediaItem[];
}

export interface ActivePassSummary {
  id: string;
  category: PropertyCategory;
  expires_at: string;
}

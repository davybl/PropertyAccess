export interface KenyaNeighborhood {
  name: string;
  landmarks: string[];
  lat: number;
  lng: number;
}

export interface KenyaCity {
  city: "Nairobi" | "Mombasa" | "Nakuru";
  center: { lat: number; lng: number };
  neighborhoods: KenyaNeighborhood[];
}

export const KENYA_LOCATIONS: KenyaCity[] = [
  {
    city: "Nairobi",
    center: { lat: -1.2864, lng: 36.8172 },
    neighborhoods: [
      {
        name: "Kahawa Wendani",
        landmarks: ["Magunas Supermarket", "Thika Road Stage", "Wendani Hospital", "St. Joseph Catholic Church"],
        lat: -1.1965,
        lng: 36.9317,
      },
      {
        name: "Kahawa Sukari",
        landmarks: ["Quickmart Kahawa Sukari", "Engen Petrol Station", "Kahawa Sukari Baptist", "Baringo Road"],
        lat: -1.1869,
        lng: 36.9365,
      },
      {
        name: "Kenyatta University / KM",
        landmarks: ["KM Stage", "Unicity Mall", "KU Main Gate", "Kahawa Barracks"],
        lat: -1.1806,
        lng: 36.9278,
      },
      {
        name: "Roysambu",
        landmarks: ["Thika Road Mall (TRM)", "Lumumba Drive", "PAC University", "USIU Road"],
        lat: -1.2185,
        lng: 36.8869,
      },
      {
        name: "Zimmerman",
        landmarks: ["Base Stage", "Mirema Drive", "Canopy", "Powerstar Supermarket"],
        lat: -1.2098,
        lng: 36.8973,
      },
      {
        name: "Githurai 44 & 45",
        landmarks: ["Githurai 45 Roundabout", "Progressive Stage", "Mwiki Road Junction"],
        lat: -1.2016,
        lng: 36.9154,
      },
      {
        name: "Kasarani",
        landmarks: ["Seasons Stage", "Sunton", "Mwiki Road", "Kasarani Stadium"],
        lat: -1.2219,
        lng: 36.8986,
      },
      {
        name: "Ruaka",
        landmarks: ["Two Rivers Mall", "Quickmart Ruaka", "Rosslyn Riviera", "Limuru Road"],
        lat: -1.2067,
        lng: 36.7819,
      },
      {
        name: "Westlands",
        landmarks: ["Sarit Centre", "Westgate Mall", "GTC Tower", "Waiyaki Way"],
        lat: -1.2673,
        lng: 36.8111,
      },
      {
        name: "Kilimani",
        landmarks: ["Yaya Centre", "Adlife Plaza", "Argwings Kodhek Road", "Denis Pritt Road"],
        lat: -1.2921,
        lng: 36.7831,
      },
      {
        name: "Kileleshwa",
        landmarks: ["Kasuku Centre", "Quickmart Kileleshwa", "Oloitoktok Road"],
        lat: -1.2836,
        lng: 36.7812,
      },
      {
        name: "Lavington",
        landmarks: ["Lavington Mall", "Valley Arcade", "Gitanga Road"],
        lat: -1.2818,
        lng: 36.7667,
      },
      {
        name: "Karen",
        landmarks: ["The Hub Karen", "Waterfront Karen", "Crossroads", "Hardy"],
        lat: -1.3197,
        lng: 36.7085,
      },
      {
        name: "Lang'ata",
        landmarks: ["Galleria Shopping Mall", "Carnivore", "Jonathan Ngeno Estate"],
        lat: -1.3375,
        lng: 36.7681,
      },
      {
        name: "South B",
        landmarks: ["Capital Centre", "Sana Sana", "Mariakani", "Mombasa Road"],
        lat: -1.3106,
        lng: 36.8339,
      },
      {
        name: "South C",
        landmarks: ["Mugoya Shopping Centre", "Nextgen Mall", "Bellevue"],
        lat: -1.3192,
        lng: 36.8267,
      },
      {
        name: "Embakasi & Utawala",
        landmarks: ["Benedicta Stage", "Eastern Bypass", "Quickmart Utawala", "Nyayo Estate"],
        lat: -1.2844,
        lng: 36.9614,
      },
      {
        name: "Donholm & Fedha",
        landmarks: ["Greenspan Mall", "Caltex Stage", "Jacaranda", "Fedha Gate"],
        lat: -1.2961,
        lng: 36.8919,
      },
      {
        name: "Ngong Road & Adams",
        landmarks: ["Prestige Plaza", "Adams Arcade", "Junction Mall", "Racecourse"],
        lat: -1.3005,
        lng: 36.7654,
      },
      {
        name: "Parklands & Pangani",
        landmarks: ["Diamond Plaza", "Aga Khan Hospital", "Pangani Girls", "Fig Tree Ngara"],
        lat: -1.2662,
        lng: 36.8358,
      },
    ],
  },
  {
    city: "Mombasa",
    center: { lat: -4.0435, lng: 39.6682 },
    neighborhoods: [
      {
        name: "Nyali",
        landmarks: ["City Mall Nyali", "Nyali Centre", "Naivas Nyali", "Links Road", "Wild Waters"],
        lat: -4.0226,
        lng: 39.7135,
      },
      {
        name: "Bamburi",
        landmarks: ["Haller Park", "Bamburi Mwisho", "Vescon Estate", "Pirates Beach"],
        lat: -3.9961,
        lng: 39.7219,
      },
      {
        name: "Shanzu & Mtwapa Bridge",
        landmarks: ["Shanzu Beach", "Serena Road", "Mtwapa Bridge"],
        lat: -3.9575,
        lng: 39.7442,
      },
      {
        name: "Tudor",
        landmarks: ["Technical University of Mombasa (TUM)", "Tudor Water Sports", "Tom Mboya Avenue"],
        lat: -4.0378,
        lng: 39.6611,
      },
      {
        name: "Mombasa CBD & Ganjoni",
        landmarks: ["Moi Avenue Tusks", "Fort Jesus", "Ganjoni Hospital", "Makupa"],
        lat: -4.0547,
        lng: 39.6636,
      },
      {
        name: "Kizingo",
        landmarks: ["Mama Ngina Waterfront", "State House Road", "Aga Khan Hospital Mombasa"],
        lat: -4.0706,
        lng: 39.6758,
      },
      {
        name: "Buxton & Makadara",
        landmarks: ["Buxton Junction", "Nyali Bridge Approach", "Old Town"],
        lat: -4.0469,
        lng: 39.6733,
      },
      {
        name: "Changamwe & Port Reitz",
        landmarks: ["Chaani", "Moi International Airport", "Magongo", "Port Reitz"],
        lat: -4.0242,
        lng: 39.6186,
      },
      {
        name: "Likoni",
        landmarks: ["Likoni Ferry Terminal", "Shelly Beach", "Kona Zamani"],
        lat: -4.0861,
        lng: 39.6614,
      },
      {
        name: "Mikindani & Jomvu",
        landmarks: ["Mikindani Stage", "Kwa Jomvu", "SGR Miritini Terminus"],
        lat: -3.9989,
        lng: 39.5892,
      },
    ],
  },
  {
    city: "Nakuru",
    center: { lat: -0.3031, lng: 36.08 },
    neighborhoods: [
      {
        name: "Section 58",
        landmarks: ["Section 58 Shopping Centre", "Old Nairobi Road Overpass", "Dog Section Stage"],
        lat: -0.2834,
        lng: 36.0911,
      },
      {
        name: "Milimani",
        landmarks: ["State House Nakuru", "Nakuru Golf Club", "Menengai Crater Viewpoint"],
        lat: -0.2725,
        lng: 36.0681,
      },
      {
        name: "Nakuru CBD",
        landmarks: ["Westside Mall", "Golden Life Mall", "Kenyatta Avenue", "Nyayo Gardens"],
        lat: -0.2833,
        lng: 36.0667,
      },
      {
        name: "Naka",
        landmarks: ["Naka Shopping Centre", "Lake Nakuru View", "Moi Primary"],
        lat: -0.3042,
        lng: 36.1036,
      },
      {
        name: "Free Area",
        landmarks: ["Free Area Stage", "Nakuru-Nairobi Highway", "Kiratina"],
        lat: -0.2889,
        lng: 36.1133,
      },
      {
        name: "Lanet",
        landmarks: ["Lanet Barracks", "Umoja 1 & 2", "Muguga"],
        lat: -0.3114,
        lng: 36.1436,
      },
      {
        name: "Kiamunyi & Kabarak Road",
        landmarks: ["Kabarak University Gate", "Olive Inn", "RVIST", "London Stage"],
        lat: -0.2581,
        lng: 36.0389,
      },
      {
        name: "Shaabab & Kenlands",
        landmarks: ["Kenlands Stage", "Shaabab Market", "Langa Langa"],
        lat: -0.2958,
        lng: 36.0514,
      },
      {
        name: "Whitehouse & Menengai",
        landmarks: ["Whitehouse Stage", "Solai Road", "Bahati Junction"],
        lat: -0.2644,
        lng: 36.0947,
      },
      {
        name: "Pipeline & Barnabas",
        landmarks: ["Barnabas Stage", "Pipeline Trading Centre", "Greensteds"],
        lat: -0.3267,
        lng: 36.1619,
      },
    ],
  },
];

export const ALL_NEIGHBORHOODS = KENYA_LOCATIONS.flatMap((city) =>
  city.neighborhoods.map((neighborhood) => ({
    ...neighborhood,
    city: city.city,
  }))
);

export function buildGoogleMapsSearchUrl(params: {
  landmark?: string | null;
  neighborhood: string;
  city: string;
}) {
  const query = [params.landmark, params.neighborhood, params.city, "Kenya"]
    .filter(Boolean)
    .join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const PROPERTY_TYPES = [
  "Land",
  "House",
  "Apartment",
  "Hotel",
  "Shortlet",
  "Other",
] as const;

export const PURPOSES = ["Sale", "Rent"] as const;
export const AVAILABILITIES = ["Available", "Unavailable"] as const;

export const FEATURE_OPTIONS = [
  "WiFi",
  "Parking",
  "Security",
  "Generator",
  "Air conditioning",
  "Water supply",
  "Furnished",
  "Kitchen",
  "Swimming pool",
  "Gym",
  "CCTV",
  "Prepaid meter",
  "POP ceiling",
  "Wardrobe",
  "Balcony",
  "Elevator",
];

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type Purpose = (typeof PURPOSES)[number];
export type Availability = (typeof AVAILABILITIES)[number];

export type Listing = {
  id: string;
  title: string;
  location: string;
  price: string | number;
  propertyType: PropertyType | string;
  purpose: Purpose | string;
  tag?: string;
  description: string;
  plots?: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size?: string;
  features: string[];
  images: string[];
  video?: string;
  latitude?: number | null;
  longitude?: number | null;
  availability: Availability | string;
  status?: string;
  agentId?: string;
};

export const isLand = (type?: string) => type === "Land";
export const needsRooms = (type?: string) =>
  type === "House" || type === "Apartment" || type === "Hotel" || type === "Shortlet";
export const needsListingDetails = (type?: string) => Boolean(type) && type !== "Land";

export const formatPrice = (price: string | number) => {
  const n = Number(String(price).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return "₦0";
  return `₦${n.toLocaleString()}`;
};

export const purposeLabel = (purpose?: string, tag?: string) => {
  if (tag) return tag;
  if (purpose === "Sale" || tag === "For Sale") return "For Sale";
  if (purpose === "Rent" || tag === "For Rent") return "For Rent";
  if (tag === "Shortlet") return "Shortlet";
  return purpose === "Sale" ? "For Sale" : "For Rent";
};

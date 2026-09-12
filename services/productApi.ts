import { API } from "./api";

export type PropertyAgent = {
  id: string;
  name: string;
  avatar?: string | null;
  agencyName?: string | null;
  verified?: boolean;
  phone?: string | null;
  isOnline?: boolean;
  lastSeen?: number | null;
  status?: "online" | "offline";
};

export type Property = {
  id: string;
  title: string;
  location?: string | null;
  price?: number | string | null;
  propertyType?: string | null;
  purpose?: "Sale" | "Rent" | string | null;
  description?: string | null;
  images?: string[];
  thumbnails?: string[];
  coverImage?: string | null;
  image?: string | null;
  imageCount?: number;
  video?: string | null;
  hasVideo?: boolean;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  beds?: number | string | null;
  baths?: number | string | null;
  size?: number | string | null;
  status?: string | null;
  isAvailable?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  agentId?: string | null;
  agent?: PropertyAgent | null;
  views?: number;
  inquiries?: number;
  created_at?: any;
  updated_at?: any;
};

export const formatPropertyPrice = (price?: number | string | null) => {
  if (price === null || price === undefined || price === "") return "Price on request";
  const numeric =
    typeof price === "number"
      ? price
      : Number(String(price).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric)) return String(price);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const purposeLabel = (purpose?: string | null, propertyType?: string | null) => {
  if (purpose === "Sale") return "For Sale";
  if (purpose === "Rent") {
    if (propertyType === "Shortlet" || propertyType === "Hotel") return propertyType;
    return "For Rent";
  }
  return propertyType || "Listing";
};

export const periodLabel = (purpose?: string | null, propertyType?: string | null) => {
  if (purpose === "Sale") return "";
  if (propertyType === "Apartment") return " / year";
  return " / day";
};

/** Agent-owned list */
export const fetchMyProducts = async (): Promise<Property[]> => {
  const { data } = await API.get("/products/get-rental-products");
  return (data.products || []).map((p: any) => ({
    ...p,
    bedrooms: p.bedrooms ?? p.beds ?? null,
    bathrooms: p.bathrooms ?? p.baths ?? null,
  }));
};

/** Agent-owned detail */
export const fetchOwnedProduct = async (id: string): Promise<Property> => {
  const { data } = await API.get(`/products/get-rental-product/${id}`);
  return {
    ...data,
    id: data.id,
    bedrooms: data.bedrooms ?? data.beds ?? null,
    bathrooms: data.bathrooms ?? data.baths ?? null,
  };
};

/** Public client detail (includes agent + presence) */
export const fetchPublicProduct = async (id: string): Promise<Property> => {
  const { data } = await API.get(`/agentid/property/${id}`);
  return {
    ...data,
    id: data.id,
    bedrooms: data.bedrooms ?? data.beds ?? null,
    bathrooms: data.bathrooms ?? data.baths ?? null,
  };
};

export const deleteProduct = (id: string) =>
  API.delete(`/products/delete-rental-product/${id}`);

export const updateProduct = (
  id: string,
  formData: FormData,
  onUploadProgress?: (percent: number) => void
) =>
  API.put(`/products/update-rental-product/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!onUploadProgress) return;
      const percent = Math.round((event.loaded * 100) / (event.total || 1));
      onUploadProgress(percent);
    },
  });

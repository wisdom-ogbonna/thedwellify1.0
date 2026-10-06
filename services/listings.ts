import { API } from "./api";
import type { Availability, Listing } from "../constants/listings";

type MediaFile = { uri: string; name?: string; type?: string };

export type ListingAgent = {
  id: string;
  name: string;
  agencyName?: string;
  phone?: string;
};

export type PublicListing = Listing & {
  agent?: ListingAgent | null;
};

export type ListingPayload = {
  title?: string;
  location: string;
  price: string;
  propertyType: string;
  purpose: string;
  description?: string;
  plots?: string;
  bedrooms?: string;
  bathrooms?: string;
  size?: string;
  features: string[];
  latitude?: number | null;
  longitude?: number | null;
  availability?: string;
  images: MediaFile[];
  keepImages?: string[];
  video?: MediaFile | null;
  removeVideo?: boolean;
};

const appendFile = (form: FormData, field: string, file: MediaFile) => {
  form.append(field, {
    uri: file.uri,
    name: file.name || field,
    type: file.type || "application/octet-stream",
  } as any);
};

const toFormData = (payload: ListingPayload, isUpdate = false) => {
  const form = new FormData();
  if (payload.title) form.append("title", payload.title);
  form.append("location", payload.location);
  form.append("price", payload.price);
  form.append("propertyType", payload.propertyType);
  form.append("purpose", payload.purpose);
  if (payload.description) form.append("description", payload.description);
  form.append("features", JSON.stringify(payload.features || []));
  if (payload.propertyType === "Land" && payload.plots) {
    form.append("plots", payload.plots);
  }
  if (payload.bedrooms != null && payload.bedrooms !== "") {
    form.append("bedrooms", payload.bedrooms);
  }
  if (payload.bathrooms != null && payload.bathrooms !== "") {
    form.append("bathrooms", payload.bathrooms);
  }
  if (payload.size != null) form.append("size", payload.size);
  if (payload.latitude != null) form.append("latitude", String(payload.latitude));
  if (payload.longitude != null) {
    form.append("longitude", String(payload.longitude));
  }
  if (payload.availability) form.append("availability", payload.availability);

  payload.images.forEach((img, index) => {
    appendFile(form, "images", {
      ...img,
      name: img.name || `image_${index}.jpg`,
      type: img.type || "image/jpeg",
    });
  });

  if (isUpdate) {
    form.append("keepImages", JSON.stringify(payload.keepImages || []));
    if (payload.removeVideo) form.append("removeVideo", "true");
  }

  if (payload.video) {
    appendFile(form, "video", {
      ...payload.video,
      name: payload.video.name || "video.mp4",
      type: payload.video.type || "video/mp4",
    });
  }

  return form;
};

export const listingsApi = {
  available: async (params: {
    propertyType?: string;
    purpose?: string;
    sort?: "newest" | "price_asc" | "price_desc";
    q?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}) => {
    const res = await API.get<{ products: PublicListing[]; total: number }>(
      "/products/available",
      { params },
    );
    return {
      products: res.data?.products || [],
      total: res.data?.total || 0,
    };
  },

  list: async () => {
    const res = await API.get<any>("/products/get-rental-products");
    const rows = Array.isArray(res.data)
      ? res.data
      : res.data?.products || res.data?.data || [];
    return (rows as Listing[]).filter((item) => item && item.id);
  },

  get: async (id: string) => {
    const res = await API.get<Listing>(`/products/get-rental-product/${id}`);
    return res.data;
  },

  create: async (payload: ListingPayload) => {
    const res = await API.post("/products/add-rental-product", toFormData(payload));
    return res.data;
  },

  update: async (id: string, payload: ListingPayload) => {
    const res = await API.put(
      `/products/update-rental-product/${id}`,
      toFormData(payload, true),
    );
    return res.data;
  },

  remove: async (id: string) => {
    const res = await API.delete(`/products/delete-rental-product/${id}`);
    return res.data;
  },

  setAvailability: async (id: string, availability: Availability) => {
    const res = await API.put(`/products/rental-product/${id}/availability`, {
      availability,
    });
    return res.data;
  },
};

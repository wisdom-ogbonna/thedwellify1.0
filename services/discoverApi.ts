import { API } from "./api";

export type DiscoverAgent = {
  id: string;
  name: string;
  avatar: string | null;
  agencyName: string | null;
  verified: boolean;
  isOnline: boolean;
  lastSeen: number | null;
  status: "online" | "offline";
};

export type DiscoverProperty = {
  id: string;
  title: string;
  location: string | null;
  price: number | string | null;
  propertyType: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  beds: number | string | null;
  baths: number | string | null;
  size: number | string | null;
  agentId: string;
  agent: DiscoverAgent;
};

/**
 * Client Discover feed — random available products with owning agents + presence.
 * Agent identity is always server-derived from the product document.
 */
export const fetchDiscoverFeed = async (
  limit = 10,
  propertyType?: string | null
): Promise<DiscoverProperty[]> => {
  const { data } = await API.get("/products/discover", {
    params: {
      limit,
      ...(propertyType ? { propertyType } : {}),
    },
  });

  return (data.items ?? []) as DiscoverProperty[];
};

export const formatDiscoverPrice = (
  price: number | string | null | undefined
): string => {
  if (price === null || price === undefined || price === "") return "Price on request";

  const numeric = typeof price === "number" ? price : Number(String(price).replace(/[^\d.]/g, ""));

  if (!Number.isFinite(numeric)) return String(price);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
};

export const periodForPropertyType = (propertyType?: string | null): string => {
  if (!propertyType) return "";
  return propertyType === "Apartment" ? " / year" : " / day";
};

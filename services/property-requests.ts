import { API } from "./api";

export type PropertyRequestPayload = {
  lookingFor?: string;
  purpose: "Buy" | "Rent";
  propertyType: string;
  location: string;
  minBudget?: number | null;
  maxBudget: number;
  bedrooms?: string;
  features?: string[];
};

export type PropertyRequest = {
  requestId: string;
  clientId: string;
  clientName: string;
  lookingFor: string;
  purpose: string;
  propertyType: string;
  location: string;
  minBudget: number | null;
  maxBudget: number | null;
  bedrooms: string;
  features: string[];
  status: string;
};

type CreateResponse = {
  success: boolean;
  message: string;
  requestId: string;
  request: PropertyRequest;
  notifications?: {
    agents: number;
    sent: number;
    failed: number;
    skipped: number;
  };
};

const messageFromError = (error: any) => {
  const data = error?.response?.data;
  if (data?.missing?.length) {
    return `${data.error || "Missing fields"}: ${data.missing.join(", ")}`;
  }
  return data?.error || error?.message || "Failed to send property request";
};

export const createPropertyRequest = async (payload: PropertyRequestPayload) => {
  try {
    const res = await API.post<CreateResponse>("/client/property-requests", payload);
    return res.data;
  } catch (error) {
    throw new Error(messageFromError(error));
  }
};

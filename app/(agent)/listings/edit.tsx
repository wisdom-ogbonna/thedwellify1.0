import ListingForm from "@/components/listings/listing-form";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <ListingForm listingId={id} />;
}

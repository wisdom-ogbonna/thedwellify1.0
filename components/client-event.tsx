import React from "react";
import Matched from "./client-ui/matched";
import Request from "./client-ui/request";

function ClientEvent({
  locationLoading,
  address,
  lat,
  lng,
  getLocation,
  PROPERTY_TYPES,
  selectedType,
  setSelectedType,
  handleRequest,
  loading,
  setAgent,
  agent,
}: any): React.JSX.Element {
  const hasMatchedAgent = !!agent?.agentId;

  return (
    <>
      {hasMatchedAgent ? (
        <Matched agent={agent} setAgent={setAgent} />
      ) : (
        <Request
          locationLoading={locationLoading}
          address={address}
          lat={lat}
          lng={lng}
          getLocation={getLocation}
          PROPERTY_TYPES={PROPERTY_TYPES}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          handleRequest={handleRequest}
          loading={loading}
        />
      )}
    </>
  );
}

export default ClientEvent;

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
matchData,
setMatchData,
}: any): React.JSX.Element {
  const hasMatchedAgent = !!matchData?.agent?.agentId;

  return (
    <>
      {hasMatchedAgent ? (
        <Matched
  agent={matchData?.agent}
  request={matchData?.request}
  setMatchData={setMatchData}
/>
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
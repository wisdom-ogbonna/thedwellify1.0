import React from "react";
import Matched from "./client-ui/matched";
import Request from "./client-ui/request";

function ClientEvent({
  locationLoading,
  address,
  getLocation,
  PROPERTY_TYPES,
  selectedType,
  setSelectedType,
  handleRequest,
  loading,
  matchData,
  setMatchData,
  requestStatus,
}: any): React.JSX.Element {

  const hasMatchedAgent =
    !!matchData?.agent?.agentId ||
    requestStatus === "matched" ||
    requestStatus === "inspection_started";

  return (
    <>
      {hasMatchedAgent ? (
        <Matched
          agent={matchData?.agent}
          request={matchData?.request}
          requestStatus={requestStatus}
          setMatchData={setMatchData}
        />
      ) : (
        <Request
          locationLoading={locationLoading}
          address={address}
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
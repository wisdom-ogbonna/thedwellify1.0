import React from "react";
import Matched from "./client-ui/matched";
import Request from "./client-ui/request";
import Waiting from "./client-ui/waiting";

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
  requestId,
}: any): React.JSX.Element {
  const isAccepted =
    requestStatus === "matched" || requestStatus === "inspection_started";
  const isWaiting = ["pending", "offered", "no_agents", "cancelled", "expired", "invalidated"].includes(
    requestStatus || "",
  );

  if (isAccepted) {
    return (
      <Matched
        agent={matchData?.agent}
        request={matchData?.request || { requestId, ...(matchData || {}) }}
        matchData={matchData}
        requestStatus={requestStatus}
        setMatchData={setMatchData}
      />
    );
  }

  if (isWaiting || loading) {
    return (
      <Waiting
        requestStatus={loading && !requestStatus ? "pending" : requestStatus}
        requestId={requestId || matchData?.request?.requestId}
        message={matchData?.message}
        onReset={() => {
          setMatchData?.(null);
        }}
      />
    );
  }

  return (
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
  );
}

export default ClientEvent;

import * as Location from "expo-location";

const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 1500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * iOS throws kCLErrorDomain error 0 (location unknown) when no fix is
 * available yet, e.g. on the simulator without a simulated location or
 * indoors right after launch. Fall back to the cached position, then retry
 * at a lower accuracy before giving up.
 */
export const getCurrentPositionSafe = async (
  accuracy: Location.Accuracy = Location.Accuracy.Balanced,
): Promise<Location.LocationObject> => {
  try {
    return await Location.getCurrentPositionAsync({ accuracy });
  } catch (firstError) {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
    }).catch(() => null);

    if (lastKnown) return lastKnown;

    await wait(RETRY_DELAY_MS);

    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
    } catch {
      const anyKnown = await Location.getLastKnownPositionAsync().catch(
        () => null,
      );

      if (anyKnown) return anyKnown;

      throw firstError;
    }
  }
};

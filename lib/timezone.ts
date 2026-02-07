import { supabase } from "./supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TIMEZONE_SYNCED_KEY = "timezone_synced";

/**
 * Gets the device's IANA timezone (e.g., "America/New_York")
 */
export const getDeviceTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Syncs the user's device timezone to their profile.
 * Only runs once per user, using AsyncStorage as a cache.
 *
 * @param userId - The authenticated user's ID
 * @returns true if timezone was synced, false if already synced or failed
 */
export const syncUserTimezone = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  const cacheKey = `${TIMEZONE_SYNCED_KEY}:${userId}`;

  try {
    // Check if already synced
    const alreadySynced = await AsyncStorage.getItem(cacheKey);
    if (alreadySynced === "true") {
      return false;
    }

    const timezone = getDeviceTimezone();

    const { error } = await supabase
      .from("profiles")
      .update({ timezone })
      .eq("id", userId);

    if (error) {
      console.error("[Timezone] Failed to sync timezone:", error.message);
      return false;
    }

    // Mark as synced
    await AsyncStorage.setItem(cacheKey, "true");
    console.log("[Timezone] Synced:", timezone);
    return true;
  } catch (e) {
    console.error("[Timezone] Error syncing timezone:", e);
    return false;
  }
};

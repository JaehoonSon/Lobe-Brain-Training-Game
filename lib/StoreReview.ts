import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as StoreReviewer from "expo-store-review";

const STORE_REVIEW_LAST_REQUEST_KEY = "store_review_last_request_timestamp";
const STORE_REVIEW_LAST_PROMPT_KEY = "store_review_last_prompt_timestamp";
const STORE_REVIEW_PROMPT_COUNT_KEY = "store_review_prompt_count";
const STORE_REVIEW_COMPLETED_KEY = "store_review_completed";

const MIN_DEBOUNCE_MS = 10 * 1000; // 10 seconds to prevent rapid double calls

// Cooldown periods in milliseconds (progressive backoff)
const COOLDOWN_PERIODS = [
  3 * 24 * 60 * 60 * 1000, // 3 days after 1st prompt
  7 * 24 * 60 * 60 * 1000, // 7 days after 2nd prompt
  30 * 24 * 60 * 60 * 1000, // 30 days cap after 3rd+ prompt
];

/**
 * Utility for handling app store reviews and URLs.
 */
export const StoreReview = {
  /**
   * Returns the platform-specific store URL from Expo constants.
   */
  storeUrl: () => {
    if (Platform.OS === "ios") {
      return Constants.expoConfig?.ios?.appStoreUrl ?? null;
    } else if (Platform.OS === "android") {
      return Constants.expoConfig?.android?.playStoreUrl ?? null;
    }
    return null;
  },

  /**
   * Check if user has already completed the review.
   */
  hasCompletedReview: async (): Promise<boolean> => {
    const completed = await AsyncStorage.getItem(STORE_REVIEW_COMPLETED_KEY);
    return completed === "true";
  },

  /**
   * Mark the review as completed (user said they reviewed).
   */
  markReviewCompleted: async () => {
    await AsyncStorage.setItem(STORE_REVIEW_COMPLETED_KEY, "true");
  },

  /**
   * Reset all review tracking (useful for testing).
   */
  resetTracking: async () => {
    await AsyncStorage.multiRemove([
      STORE_REVIEW_LAST_REQUEST_KEY,
      STORE_REVIEW_LAST_PROMPT_KEY,
      STORE_REVIEW_PROMPT_COUNT_KEY,
      STORE_REVIEW_COMPLETED_KEY,
    ]);
  },

  /**
   * Get the current cooldown period based on prompt count (number of declines).
   * After 1st decline → 3 days, after 2nd → 7 days, after 3rd+ → 30 days cap.
   */
  getCooldownPeriod: (promptCount: number): number => {
    const index = Math.min(
      Math.max(promptCount - 1, 0),
      COOLDOWN_PERIODS.length - 1,
    );
    return COOLDOWN_PERIODS[index];
  },

  /**
   * Shows a custom alert asking user to review, then triggers native review if they agree.
   * @param forceDisplay - If true, skips cooldown and max prompt checks (use for onboarding).
   *                       If false/omitted, enforces progressive cooldown and max 3 prompts.
   */
  requestReview: async (forceDisplay: boolean = false) => {
    try {
      if (forceDisplay && (await StoreReviewer.hasAction())) {
        await StoreReviewer.requestReview();
        return;
      }

      if (await StoreReview.hasCompletedReview()) {
        console.log("StoreReview: Skipped - user already reviewed");
        return;
      }

      // Always debounce rapid calls (e.g., double mounts in useEffect)
      const lastPrompt = await AsyncStorage.getItem(
        STORE_REVIEW_LAST_PROMPT_KEY,
      );
      if (lastPrompt) {
        const lastPromptTime = parseInt(lastPrompt, 10);
        if (Date.now() - lastPromptTime < MIN_DEBOUNCE_MS) {
          console.log("StoreReview: Skipped - too soon after last prompt");
          return;
        }
      }

      let promptCount = parseInt(
        (await AsyncStorage.getItem(STORE_REVIEW_PROMPT_COUNT_KEY)) || "0",
        10,
      );

      if (!forceDisplay) {
        if (promptCount >= 3) {
          console.log("StoreReview: Skipped - max 3 prompts reached");
          return;
        }
        const lastRequest = await AsyncStorage.getItem(
          STORE_REVIEW_LAST_REQUEST_KEY,
        );
        if (lastRequest) {
          const lastTime = parseInt(lastRequest, 10);
          const cooldown = StoreReview.getCooldownPeriod(promptCount);
          if (Date.now() - lastTime < cooldown) {
            console.log(
              `StoreReview: Skipped - cooldown active (${cooldown / (24 * 60 * 60 * 1000)} days)`,
            );
            return;
          }
        }
      }

      if (!(await StoreReviewer.hasAction())) {
        console.log("StoreReview: Native review not available");
        return;
      }

      // Set last prompt timestamp before showing alert
      await AsyncStorage.setItem(
        STORE_REVIEW_LAST_PROMPT_KEY,
        Date.now().toString(),
      );

      Alert.alert(
        "Enjoying the app?",
        "Would you mind taking a moment to rate us? Your feedback helps us improve!",
        [
          {
            text: "Not Now",
            style: "destructive",
            onPress: async () => {
              await AsyncStorage.setItem(
                STORE_REVIEW_PROMPT_COUNT_KEY,
                (promptCount + 1).toString(),
              );
              await AsyncStorage.setItem(
                STORE_REVIEW_LAST_REQUEST_KEY,
                Date.now().toString(),
              );
              console.log("StoreReview: User declined, will ask again later");
            },
          },
          {
            text: "Rate Now",
            style: "default",
            onPress: async () => {
              await StoreReviewer.requestReview();
              await StoreReview.markReviewCompleted();
              console.log("StoreReview: Native review requested");
            },
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      console.error("Error requesting store review:", error);
    }
  },
};

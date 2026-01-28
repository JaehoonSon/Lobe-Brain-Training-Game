import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import Constants from "expo-constants";
import { AppState, AppStateStatus, Platform } from "react-native";
import {
  PostHogProvider as RNPostHogProvider,
  usePostHog,
} from "posthog-react-native";
import { useAuth } from "~/contexts/AuthProvider";
import type { JsonType, PostHogEventProperties } from "@posthog/core";

type AnalyticsPropertiesInput = Record<string, JsonType | undefined>;
type AnalyticsProperties = PostHogEventProperties;

interface AnalyticsContextValue {
  track: (event: string, properties?: AnalyticsPropertiesInput) => void;
  screen: (name: string, properties?: AnalyticsPropertiesInput) => void;
  identify: (distinctId: string, properties?: AnalyticsPropertiesInput) => void;
  reset: () => void;
}

const noop = () => {};

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track: noop,
  screen: noop,
  identify: noop,
  reset: noop,
});

const cleanProperties = (
  properties?: AnalyticsPropertiesInput
): AnalyticsProperties | undefined => {
  if (!properties) return undefined;

  const cleaned: PostHogEventProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

function AnalyticsBridge({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog();
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);
  const sessionStartTime = useRef<Date | null>(null);
  const hasTrackedInitialOpen = useRef(false);

  // Track app_opened and session_start
  useEffect(() => {
    if (!posthog) return;

    const appVersion = Constants.expoConfig?.version ?? "unknown";
    const buildNumber =
      Constants.expoConfig?.ios?.buildNumber ??
      Constants.expoConfig?.android?.versionCode?.toString() ??
      "unknown";

    // Track initial app open (cold start)
    if (!hasTrackedInitialOpen.current) {
      hasTrackedInitialOpen.current = true;
      sessionStartTime.current = new Date();

      posthog.capture("app_opened", {
        open_type: "cold_start",
        app_version: appVersion,
        app_build: buildNumber,
        platform: Platform.OS,
      });

      posthog.capture("session_start", {
        app_version: appVersion,
        platform: Platform.OS,
      });
    }

    // Track app state changes (foreground/background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App came to foreground from background
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const now = new Date();
        const sessionGapMs = sessionStartTime.current
          ? now.getTime() - sessionStartTime.current.getTime()
          : 0;

        // Consider it a new session if app was in background for more than 30 minutes
        const isNewSession = sessionGapMs > 30 * 60 * 1000;

        posthog.capture("app_opened", {
          open_type: "warm_start",
          app_version: appVersion,
          app_build: buildNumber,
          platform: Platform.OS,
        });

        if (isNewSession) {
          sessionStartTime.current = now;
          posthog.capture("session_start", {
            app_version: appVersion,
            platform: Platform.OS,
          });
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [posthog]);

  useEffect(() => {
    if (!posthog) return;

    if (user?.id) {
      posthog.identify(user.id, {
        $set: {
          email: user.email ?? null,
        },
        $set_once: {
          first_seen_at: new Date().toISOString(),
        },
      });
    } else {
      posthog.reset();
    }
  }, [posthog, user?.email, user?.id]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      track: (event, properties) => {
        posthog?.capture(event, cleanProperties(properties));
      },
      screen: (name, properties) => {
        posthog?.screen(name, cleanProperties(properties));
      },
      identify: (distinctId, properties) => {
        posthog?.identify(distinctId, cleanProperties(properties));
      },
      reset: () => {
        posthog?.reset();
      },
    }),
    [posthog]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

  if (!apiKey) {
    return (
      <AnalyticsContext.Provider
        value={{ track: noop, screen: noop, identify: noop, reset: noop }}
      >
        {children}
      </AnalyticsContext.Provider>
    );
  }

  return (
    <RNPostHogProvider
      apiKey={apiKey}
      options={{
        host,
        captureAppLifecycleEvents: false, // We handle this manually for more control
        flushAt: 20,
      }}
      autocapture={{
        captureScreens: false,
        captureTouches: false,
      }}
    >
      <AnalyticsBridge>{children}</AnalyticsBridge>
    </RNPostHogProvider>
  );
}

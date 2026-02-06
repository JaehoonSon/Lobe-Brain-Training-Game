import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useAuth } from "~/contexts/AuthProvider";
import { supabase } from "~/lib/supabase";

// Helper function to open notification settings
const openNotificationSettings = () => {
  Linking.openSettings();
};

// Configure how notifications are displayed when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  lastNotificationResponse: Notifications.NotificationResponse | null;
  permissionStatus: Notifications.PermissionStatus | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  getPermissionStatus: () => Promise<Notifications.NotificationPermissionsStatus>;
  disableNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [lastNotificationResponse, setLastNotificationResponse] =
    useState<Notifications.NotificationResponse | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing push token from database when user is authenticated
  // Also check if OS-level permission is still granted
  useEffect(() => {
    const loadExistingToken = async () => {
      if (!user) {
        setExpoPushToken(null);
        setIsLoading(false);
        return;
      }

      try {
        // Check OS-level permission status first
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);

        const { data, error } = await supabase
          .from("push_tokens")
          .select("expo_push_token")
          .eq("profile_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("Error loading push token:", error);
        } else if (data) {
          // If we have a token in DB but permission is no longer granted,
          // disable the token in the database to keep them in sync
          if (status !== "granted") {
            console.log(
              "Notifications disabled from device Settings, updating database",
            );
            await supabase
              .from("push_tokens")
              .update({ is_active: false })
              .eq("expo_push_token", data.expo_push_token);
            setExpoPushToken(null);
          } else {
            setExpoPushToken(data.expo_push_token);
          }
        }
      } catch (error) {
        console.error("Failed to load push token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingToken();
  }, [user]);

  // Set up notification listeners on mount
  useEffect(() => {
    // Listener for incoming notifications while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        setNotification(notification);
      },
    );

    // Listener for user interactions with notifications
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response received:", response);
        setLastNotificationResponse(response);
      });

    // Check initial permission status
    Notifications.getPermissionsAsync().then((status) => {
      setPermissionStatus(status.status);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Save push token to database
  const savePushToken = useCallback(
    async (token: string) => {
      if (!user) {
        console.warn("Cannot save push token: No user authenticated");
        return;
      }

      try {
        // Use upsert to handle both insert and update cases
        // Check if token already exists for this user
        const { data: existing } = await supabase
          .from("push_tokens")
          .select("id")
          .eq("expo_push_token", token)
          .maybeSingle();

        if (existing) {
          // Token exists, update it to be active
          const { error } = await supabase
            .from("push_tokens")
            .update({
              is_active: true,
              device_type: Platform.OS as "ios" | "android",
              device_name: Device.deviceName ?? undefined,
            })
            .eq("expo_push_token", token);

          if (error) throw error;
        } else {
          // Insert new token
          const { error } = await supabase.from("push_tokens").insert({
            profile_id: user.id,
            expo_push_token: token,
            device_type: Platform.OS as "ios" | "android",
            device_name: Device.deviceName ?? undefined,
            is_active: true,
          });

          if (error) throw error;
        }

        console.log("Push token saved to database");
      } catch (error) {
        console.error("Failed to save push token:", error);
      }
    },
    [user],
  );

  // Get current permission status
  const getPermissionStatus = useCallback(async () => {
    const status = await Notifications.getPermissionsAsync();
    setPermissionStatus(status.status);
    return status;
  }, []);

  // Request permission and get expo push token
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Only works on physical devices
      if (!Device.isDevice) {
        console.warn("Push notifications require a physical device");
        return false;
      }

      // Check current status
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      // If permission was previously denied, show alert to go to settings
      if (existingStatus === "denied") {
        Alert.alert(
          "Notifications Disabled",
          "You have previously declined notifications. Please enable them in Settings to receive notifications.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Open Settings",
              onPress: openNotificationSettings,
            },
          ],
        );
        return false;
      }

      let finalStatus: Notifications.PermissionStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus !== "granted") {
        console.log("Notification permission not granted");
        return false;
      }

      // Get Expo push token
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.error("Project ID not found for push notifications");
        return false;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log("Expo push token:", tokenData.data);
      setExpoPushToken(tokenData.data);

      // Save token to database
      await savePushToken(tokenData.data);

      return true;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [savePushToken]);

  // Disable notifications (soft-delete token in database)
  const disableNotifications = useCallback(async (): Promise<void> => {
    if (!user || !expoPushToken) {
      console.log("No active push token to disable");
      setExpoPushToken(null);
      return;
    }

    try {
      // Soft-delete: set is_active to false
      const { error } = await supabase
        .from("push_tokens")
        .update({ is_active: false })
        .eq("expo_push_token", expoPushToken);

      if (error) throw error;

      console.log("Push notifications disabled");
      setExpoPushToken(null);
    } catch (error) {
      console.error("Failed to disable notifications:", error);
    }
  }, [user, expoPushToken]);

  const value = useMemo<NotificationContextType>(
    () => ({
      expoPushToken,
      notification,
      lastNotificationResponse,
      permissionStatus,
      isLoading,
      requestPermission,
      getPermissionStatus,
      disableNotifications,
    }),
    [
      expoPushToken,
      notification,
      lastNotificationResponse,
      permissionStatus,
      isLoading,
      requestPermission,
      getPermissionStatus,
      disableNotifications,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

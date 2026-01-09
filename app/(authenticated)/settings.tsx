import { useState, useEffect } from "react";
import {
  ChevronRight,
  LogOut,
  ShieldCheck,
  BookText,
  Trash,
  User,
  Info,
  Crown,
  Cake,
} from "lucide-react-native";
import { View, TouchableOpacity, Alert, ScrollView } from "react-native";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { showErrorToast } from "~/components/ui/toast";
import { H1, H2, Muted, P } from "~/components/ui/typography";
import { Card } from "~/components/ui/card";
import { useAuth } from "~/contexts/AuthProvider";
import { useRevenueCat, ENTITLEMENT_ID } from "~/contexts/RevenueCatProvider";
import { playHaptic } from "~/lib/hapticSound";
import { appMetadata } from "~/config";
import { supabase } from "~/lib/supabase";

// Get version info from app.json via expo-constants
const appVersion = Constants.expoConfig?.version ?? "1.0.0";
const buildNumber =
  Constants.expoConfig?.ios?.buildNumber ??
  Constants.expoConfig?.android?.versionCode?.toString() ??
  "1";

export default function Settings() {
  const { user, logout } = useAuth();
  const { isPro, presentPaywall, currentOffering } = useRevenueCat();
  const [birthday, setBirthday] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_data")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        // Extract birthday from onboarding_data if it exists
        const onboardingData = data?.onboarding_data as Record<
          string,
          any
        > | null;
        if (onboardingData?.birthday) {
          setBirthday(onboardingData.birthday);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchProfile();
  }, [user]);

  const handleMembershipPress = async () => {
    playHaptic("soft");
    if (!isPro) {
      await presentPaywall();
    }
    // If Pro, we just show the info (no action needed)
  };

  const handle_privacy = async () => {
    playHaptic("soft");
    await WebBrowser.openBrowserAsync(appMetadata.privacyPolicyUrl);
  };

  const handle_eula = async () => {
    playHaptic("soft");
    await WebBrowser.openBrowserAsync(appMetadata.endUserLicenseAgreementUrl);
  };

  const handle_tos = async () => {
    playHaptic("soft");
    await WebBrowser.openBrowserAsync(appMetadata.termsOfServiceUrl);
  };

  const handleLogout = async () => {
    try {
      playHaptic("light");
      await logout();
    } catch (err) {
      showErrorToast("Error signing out");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              playHaptic("light");
              await logout();
            } catch (err) {
              showErrorToast("Error deleting account");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Get membership label
  const membershipLabel = isPro ? ENTITLEMENT_ID : "Member (limited access)";
  const membershipDescription = isPro
    ? "You have full access to all features"
    : "Tap to upgrade";

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Header */}
        <H1 className="px-6 pt-6 mb-2">Settings</H1>

        {/* Settings List */}
        <View className="px-6">
          {/* My Information Section */}
          <SectionHeader>My Information</SectionHeader>
          <Card className="overflow-hidden">
            <View className="flex-row items-center px-4 py-3.5">
              <View className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-muted">
                <User size={18} className="text-foreground" />
              </View>
              <View className="flex-1">
                <Muted className="text-sm">Email</Muted>
                <P className="text-lg text-foreground">
                  {user?.email || "Not set"}
                </P>
              </View>
            </View>
            {birthday && (
              <>
                <Divider />
                <View className="flex-row items-center px-4 py-3.5">
                  <View className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-muted">
                    <Cake size={18} className="text-foreground" />
                  </View>
                  <View className="flex-1">
                    <Muted className="text-sm">Birthday</Muted>
                    <P className="text-lg text-foreground">{birthday}</P>
                  </View>
                </View>
              </>
            )}
          </Card>

          {/* Membership Section */}
          <SectionHeader>Membership</SectionHeader>
          <Card className="overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5"
              onPress={handleMembershipPress}
              activeOpacity={0.6}
            >
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-muted"
              >
                <Crown
                  size={18}
                  className={isPro ? "text-primary" : "text-foreground"}
                />
              </View>
              <View className="flex-1">
                <P
                  className={`text-lg font-medium ${isPro ? "text-primary" : "text-foreground"
                    }`}
                >
                  {membershipLabel}
                </P>
                <Muted className="text-sm">{membershipDescription}</Muted>
              </View>
              {!isPro && (
                <ChevronRight size={18} className="text-muted-foreground" />
              )}
            </TouchableOpacity>
          </Card>

          {/* Legal Section */}
          <SectionHeader>Legal</SectionHeader>
          <Card className="overflow-hidden">
            <SettingRow
              icon={ShieldCheck}
              label="Privacy Policy"
              onPress={handle_privacy}
            />
            <Divider />
            <SettingRow
              icon={BookText}
              label="Terms of Service"
              onPress={handle_tos}
            />
            <Divider />
            <SettingRow
              icon={BookText}
              label="License Agreement"
              onPress={handle_eula}
            />
          </Card>

          {/* Account Section */}
          <SectionHeader>Account</SectionHeader>
          <Card className="overflow-hidden">
            <SettingRow
              icon={LogOut}
              label="Logout"
              onPress={handleLogout}
              variant="destructive"
            />
            <Divider />
            <SettingRow
              icon={Trash}
              label="Delete Account"
              onPress={handleDeleteAccount}
              variant="destructive"
            />
          </Card>

          {/* About Section */}
          <SectionHeader>About</SectionHeader>
          <Card className="overflow-hidden">
            <View className="flex-row items-center px-4 py-3.5">
              <View className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-muted">
                <Info size={18} className="text-foreground" />
              </View>
              <P className="flex-1 text-lg text-foreground">
                Version {appVersion} ({buildNumber})
              </P>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper Components
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <P className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-3 ml-1 mt-8">
      {children}
    </P>
  );
}



function Divider() {
  return <View className="h-px bg-border/50 ml-14" />;
}

function SettingRow({
  icon: Icon,
  label,
  onPress,
  variant = "default",
  showChevron = true,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  variant?: "default" | "destructive";
  showChevron?: boolean;
}) {
  const isDestructive = variant === "destructive";

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4"
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View
        className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${isDestructive ? "bg-destructive/10" : "bg-muted"
          }`}
      >
        <Icon
          size={18}
          className={isDestructive ? "text-destructive" : "text-foreground"}
        />
      </View>
      <P
        className={`flex-1 text-lg ${isDestructive ? "text-destructive" : "text-foreground"
          }`}
      >
        {label}
      </P>
      {showChevron && (
        <ChevronRight
          size={18}
          className={
            isDestructive ? "text-destructive/50" : "text-muted-foreground"
          }
        />
      )}
    </TouchableOpacity>
  );
}

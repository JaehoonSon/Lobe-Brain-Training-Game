import {
  ChevronRight,
  LogOut,
  ShieldCheck,
  BookText,
  Trash,
  User,
  Info,
  Crown,
} from "lucide-react-native";
import {
  View,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { showErrorToast } from "~/components/ui/toast";
import { H1, H2, Muted, P } from "~/components/ui/typography";
import { useAuth } from "~/contexts/AuthProvider";
import { useRevenueCat, ENTITLEMENT_ID } from "~/contexts/RevenueCatProvider";
import { playHaptic } from "~/lib/hapticSound";
import { appMetadata } from "~/config";

// Get version info from app.json via expo-constants
const appVersion = Constants.expoConfig?.version ?? "1.0.0";
const buildNumber =
  Constants.expoConfig?.ios?.buildNumber ??
  Constants.expoConfig?.android?.versionCode?.toString() ??
  "1";

export default function Settings() {
  const { user, logout } = useAuth();
  const { isPro, presentPaywall, currentOffering } = useRevenueCat();

  const handleMembershipPress = async () => {
    playHaptic("soft");
    if (!isPro) {
      await presentPaywall();
    }
    // If Pro, we just show the info (no action needed)
  };

  const handle_privacy = async () => {
    playHaptic("soft");
    Linking.openURL(appMetadata.privacyPolicyUrl);
  };

  const handle_eula = async () => {
    playHaptic("soft");
    Linking.openURL(appMetadata.endUserLicenseAgreementUrl);
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
        {/* Drag Handle */}
        <View className="items-center pt-3 pb-4">
          <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </View>

        {/* Header */}
        <H1 className="px-6">Settings</H1>

        {/* Settings List */}
        <View className="px-6">
          {/* My Information Section */}
          <SectionHeader>My Information</SectionHeader>
          <SettingsCard>
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
          </SettingsCard>

          {/* Membership Section */}
          <SectionHeader>Membership</SectionHeader>
          <SettingsCard>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3.5"
              onPress={handleMembershipPress}
              activeOpacity={0.6}
            >
              <View
                className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${
                  isPro ? "bg-yellow-500/20" : "bg-muted"
                }`}
              >
                <Crown
                  size={18}
                  className={isPro ? "text-yellow-500" : "text-foreground"}
                />
              </View>
              <View className="flex-1">
                <P
                  className={`text-lg font-medium ${
                    isPro ? "text-yellow-600" : "text-foreground"
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
          </SettingsCard>

          {/* Legal Section */}
          <SectionHeader>Legal</SectionHeader>
          <SettingsCard>
            <SettingRow
              icon={ShieldCheck}
              label="Privacy Policy"
              onPress={handle_privacy}
            />
            <Divider />
            <SettingRow
              icon={BookText}
              label="Terms of Service"
              onPress={handle_eula}
            />
          </SettingsCard>

          {/* Account Section */}
          <SectionHeader>Account</SectionHeader>
          <SettingsCard>
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
          </SettingsCard>

          {/* About Section */}
          <SectionHeader>About</SectionHeader>
          <SettingsCard>
            <View className="flex-row items-center px-4 py-3.5">
              <View className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-muted">
                <Info size={18} className="text-foreground" />
              </View>
              <P className="flex-1 text-lg text-foreground">
                Version {appVersion} ({buildNumber})
              </P>
            </View>
          </SettingsCard>
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

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-card rounded-xl overflow-hidden border border-border/50">
      {children}
    </View>
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
        className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${
          isDestructive ? "bg-destructive/10" : "bg-muted"
        }`}
      >
        <Icon
          size={18}
          className={isDestructive ? "text-destructive" : "text-foreground"}
        />
      </View>
      <P
        className={`flex-1 text-lg ${
          isDestructive ? "text-destructive" : "text-foreground"
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

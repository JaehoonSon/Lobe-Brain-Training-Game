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
  Languages,
  Check,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View, TouchableOpacity, Alert, ScrollView } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { showErrorToast } from "~/components/ui/toast";
import { H1, H2, Muted, P } from "~/components/ui/typography";
import { Card } from "~/components/ui/card";
import { useAuth } from "~/contexts/AuthProvider";
import { useRevenueCat, ENTITLEMENT_ID } from "~/contexts/RevenueCatProvider";
import { playHaptic } from "~/lib/hapticSound";
import { appMetadata } from "~/config";
import { supabase } from "~/lib/supabase";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Option,
} from "~/components/ui/select";

const SUPPORTED_LANGUAGES: Option[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "pt", label: "Português" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "hi", label: "हिन्दी" },
  { value: "ru", label: "Русский" },
];

// Get version info from app.json via expo-constants
const appVersion = Constants.expoConfig?.version ?? "1.0.0";
const buildNumber =
  Constants.expoConfig?.ios?.buildNumber ??
  Constants.expoConfig?.android?.versionCode?.toString() ??
  "1";

export default function Settings() {
  const { t, i18n } = useTranslation();
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
      showErrorToast(t('common.error_generic'));
    }
  };

  const handleLanguageChange = (val: Option | null) => {
    if (val) {
      playHaptic("medium");
      i18n.changeLanguage(val.value);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.alerts.delete_confirm_title'),
      t('settings.alerts.delete_confirm_msg'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('settings.alerts.delete_btn'),
          style: "destructive",
          onPress: async () => {
            try {
              playHaptic("light");
              await logout();
            } catch (err) {
              showErrorToast(t('common.error_generic'));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Get membership label
  const membershipLabel = isPro ? t('settings.labels.pro_member') : t('settings.labels.free_member');
  const membershipDescription = isPro
    ? t('settings.labels.pro_desc')
    : t('settings.labels.free_desc');

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Header */}
        {/* Header */}
        <H1 className="px-6 pt-6 mb-2 text-3xl font-black">{t('settings.title')}</H1>

        {/* Settings List */}
        <View className="px-6">
          {/* My Information Section */}
          <SectionHeader>{t('settings.sections.my_info')}</SectionHeader>
          <Card className="overflow-hidden">
            <View className="flex-row items-center px-4 py-3.5">
              <View className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-muted">
                <User size={18} className="text-foreground" />
              </View>
              <View className="flex-1">
                <Muted className="text-sm font-bold">{t('settings.labels.email')}</Muted>
                <P className="text-lg font-bold text-foreground">
                  {user?.email || t('common.not_set')}
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
                    <Muted className="text-sm font-bold">{t('settings.labels.birthday')}</Muted>
                    <P className="text-lg font-bold text-foreground">{birthday}</P>
                  </View>
                </View>
              </>
            )}
          </Card>

          {/* Preferences Section */}
          <SectionHeader>{t('common.language')}</SectionHeader>
          <Card className="overflow-hidden">
            <View className="flex-row items-center px-4 py-1">
              <View className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-muted">
                <Languages size={18} className="text-foreground" />
              </View>
              <View className="flex-1">
                <Select
                  value={SUPPORTED_LANGUAGES.find((l) => l && l.value === i18n.language) || SUPPORTED_LANGUAGES[0]}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="border-0 bg-transparent px-3 h-12 w-full shadow-none active:bg-muted/20">
                    <SelectValue
                      className="text-lg font-bold text-foreground"
                      placeholder={t('common.language')}
                    />
                  </SelectTrigger>
                  <SelectContent className="w-[250px] native:w-[280px]" portalHost="settings-portal">
                    <SelectGroup>
                      <SelectLabel>{t('common.language')}</SelectLabel>
                      {SUPPORTED_LANGUAGES.map((lang) => lang && (
                        <SelectItem
                          key={lang.value}
                          label={lang.label}
                          value={lang.value}
                        />
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </View>
            </View>
          </Card>

          {/* Membership Section */}
          <SectionHeader>{t('settings.sections.membership')}</SectionHeader>
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
                  className={`text-lg font-black ${isPro ? "text-primary" : "text-foreground"
                    }`}
                >
                  {membershipLabel}
                </P>
                <Muted className="text-sm font-bold">{membershipDescription}</Muted>
              </View>
              {!isPro && (
                <ChevronRight size={18} className="text-muted-foreground" />
              )}
            </TouchableOpacity>
          </Card>

          {/* Legal Section */}
          <SectionHeader>{t('settings.sections.legal')}</SectionHeader>
          <Card className="overflow-hidden">
            <SettingRow
              icon={ShieldCheck}
              label={t('settings.labels.privacy')}
              onPress={handle_privacy}
            />
            <Divider />
            <SettingRow
              icon={BookText}
              label={t('settings.labels.terms')}
              onPress={handle_tos}
            />
            <Divider />
            <SettingRow
              icon={BookText}
              label={t('settings.labels.license')}
              onPress={handle_eula}
            />
          </Card>

          {/* Account Section */}
          <SectionHeader>{t('settings.sections.account')}</SectionHeader>
          <Card className="overflow-hidden">
            <SettingRow
              icon={LogOut}
              label={t('settings.actions.logout')}
              onPress={handleLogout}
              variant="destructive"
            />
            <Divider />
            <SettingRow
              icon={Trash}
              label={t('settings.actions.delete_account')}
              onPress={handleDeleteAccount}
              variant="destructive"
            />
          </Card>

          {/* About Section */}
          <SectionHeader>{t('settings.sections.about')}</SectionHeader>
          <Card className="overflow-hidden">
            <View className="flex-row items-center px-4 py-3.5">
              <View className="w-8 h-8 rounded-lg items-center justify-center mr-3 bg-muted">
                <Info size={18} className="text-foreground" />
              </View>
              <P className="flex-1 text-lg font-bold text-foreground">
                {t('settings.labels.version', { version: appVersion, build: buildNumber })}
              </P>
            </View>
          </Card>
        </View>
      </ScrollView>

      <PortalHost name="settings-portal" />
    </View>
  );
}

// Helper Components
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <P className="text-muted-foreground text-sm font-black uppercase tracking-wider mb-3 ml-1 mt-8">
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
        className={`flex-1 text-lg font-bold ${isDestructive ? "text-destructive" : "text-foreground"
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

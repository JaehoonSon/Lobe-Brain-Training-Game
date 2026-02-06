import React, { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Card } from "~/components/ui/card";
import { H1, P, Muted } from "~/components/ui/typography";
import { playHaptic } from "~/lib/hapticSound";
import {
  getPreferredLanguage,
  setPreferredLanguage,
  setSystemLanguage,
  SYSTEM_LANGUAGE_VALUE,
} from "~/lib/i18n";
import { normalizeLocale } from "~/lib/locale";

const SUPPORTED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ko", label: "한국어" },
  { value: "zh-Hans", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "hi", label: "हिन्दी" },
  { value: "ru", label: "Русский" },
];

export default function LanguageSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);

  useEffect(() => {
    const loadPref = async () => {
      const pref = await getPreferredLanguage();
      setCurrentLanguage(pref);
    };
    loadPref();
  }, []);

  const handleLanguageSelect = async (value: string) => {
    playHaptic("medium");
    setCurrentLanguage(value);

    try {
      if (value === SYSTEM_LANGUAGE_VALUE) {
        await setSystemLanguage();
      } else {
        await setPreferredLanguage(value);
      }
    } catch (error) {
      console.error("[LanguageSettings] Error changing language:", error);
    }

    // Briefly delay before going back to show the selection
    setTimeout(() => {
      router.back();
    }, 200);
  };

  const resolvedLanguage = currentLanguage ?? SYSTEM_LANGUAGE_VALUE;
  const languages = [
    { value: SYSTEM_LANGUAGE_VALUE, label: t("common.system") },
    ...SUPPORTED_LANGUAGES,
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 mb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 p-2 -ml-2 rounded-full active:bg-muted"
        >
          <ChevronLeft size={28} className="text-foreground" />
        </TouchableOpacity>
        <H1 className="text-3xl font-black">{t("common.language")}</H1>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Card className="overflow-hidden mb-6">
          {languages.map((lang, index) => {
            const isLast = index === languages.length - 1;
            const isSelected =
              lang.value === SYSTEM_LANGUAGE_VALUE
                ? resolvedLanguage === SYSTEM_LANGUAGE_VALUE
                : normalizeLocale(resolvedLanguage) === lang.value;

            return (
              <React.Fragment key={lang.value}>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-5 active:bg-muted/30"
                  onPress={() => handleLanguageSelect(lang.value)}
                >
                  <View className={`flex-1 flex-row items-center`}>
                    <P
                      className={`text-lg ${isSelected ? "font-black text-primary" : "font-bold text-foreground"}`}
                    >
                      {lang.label}
                    </P>
                  </View>
                  {isSelected && (
                    <Check size={20} className="text-primary" strokeWidth={3} />
                  )}
                </TouchableOpacity>
                {!isLast && <View className="h-px bg-border/50 ml-4" />}
              </React.Fragment>
            );
          })}
        </Card>

        <Muted className="text-center px-4">
          {t(
            "settings.labels.language_instruction",
            "Select your preferred language for the application interface.",
          )}
        </Muted>
      </ScrollView>
    </View>
  );
}

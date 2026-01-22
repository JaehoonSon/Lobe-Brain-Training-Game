import { router } from "expo-router";
import { View, useWindowDimensions, Image } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloudBackground } from "~/components/CloudBackground";
import {
  BookOpen,
  Zap,
  Trophy,
  Gamepad2,
  Lightbulb,
  Puzzle,
  Rocket,
  Target,
  Music,
  Palette,
  Sparkles,
  GraduationCap,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function IndexUnauthenticatedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View className="flex-1 bg-background">
      {/* Sky & Cloud Background - Absolute to allow content to use full height */}
      <View className="absolute top-0 left-0 right-0 z-0">
        <CloudBackground skyColor="#7dd3fc">
          {/* Scattered Icons in the Sky */}
          <View className="w-full max-w-sm aspect-square relative mt-12">

            {/* Center - App Logo */}
            <View className="absolute top-[30%] left-[35%] rotate-[5deg] bg-card rounded-2xl border-b-4 border-border shadow-sm  overflow-hidden">
              <Image
                source={require("~/assets/images/brain_logo_transparent.png")}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </View>

            {/* Top Left Cluster */}
            <View className="absolute top-[5%] left-[10%] rotate-[-15deg] p-2 bg-card rounded-xl border-b-4 border-border shadow-sm">
              <Rocket size={32} color="#f43f5e" strokeWidth={2.5} />
            </View>
            <View className="absolute top-[9%] left-[25%] rotate-[10deg] p-3 bg-card rounded-xl border-b-4 border-border shadow-sm z-10">
              <Trophy size={40} color="#f59e0b" strokeWidth={2.5} />
            </View>

            {/* Top Right Cluster */}
            <View className="absolute top-[8%] right-[25%] rotate-[15deg] p-2 bg-card rounded-xl border-b-4 border-border shadow-sm">
              <Target size={32} color="#ec4899" strokeWidth={2.5} />
            </View>
            <View className="absolute top-[20%] right-[5%] rotate-[-5deg] p-3 bg-card rounded-xl border-b-4 border-border shadow-sm z-10">
              <Zap size={44} color="#eab308" strokeWidth={2.5} />
            </View>

            {/* Middle Left */}
            <View className="absolute top-[45%] left-[5%] rotate-[-20deg] p-3 bg-card rounded-xl border-b-4 border-border shadow-sm">
              <BookOpen size={36} color="#ec4899" strokeWidth={2.5} />
            </View>
            <View className="absolute top-[30%] left-[-5%] rotate-[10deg] p-2 bg-card rounded-lg border-b-2 border-border shadow-sm">
              <Music size={24} color="#8b5cf6" strokeWidth={2.5} />
            </View>

            {/* Middle Right */}
            <View className="absolute top-[50%] right-[10%] rotate-[20deg] p-2 bg-card rounded-xl border-b-4 border-border shadow-sm">
              <Puzzle size={36} color="#10b981" strokeWidth={2.5} />
            </View>
            <View className="absolute top-[35%] right-[-10%] rotate-[-15deg] p-2 bg-card rounded-lg border-b-2 border-border shadow-sm">
              <Palette size={28} color="#f97316" strokeWidth={2.5} />
            </View>


            {/* Bottom Cluster */}
            <View className="absolute bottom-[20%] left-[20%] rotate-[5deg] p-3 bg-card rounded-xl border-b-4 border-border shadow-sm z-10">
              <Gamepad2 size={40} color="#8b5cf6" strokeWidth={2.5} />
            </View>
            <View className="absolute bottom-[20%] right-[25%] rotate-[-10deg] p-2 bg-card rounded-xl border-b-4 border-border shadow-sm">
              <Lightbulb size={32} color="#22c55e" strokeWidth={2.5} />
            </View>
            <View className="absolute bottom-[20%] inset-x-0 items-center z-0">
              <View className="p-2 bg-card rounded-lg border-b-4 border-border rotate-[-5deg]">
                <GraduationCap size={36} color="#3b82f6" strokeWidth={2.5} />
              </View>
            </View>
            <View className="absolute bottom-[45%] left-[10%] rotate-[25deg]">
              <Sparkles size={24} color="#fbbf24" fill="#fbbf24" />
            </View>
            <View className="absolute top-[15%] right-[35%] rotate-[-10deg]">
              <Sparkles size={20} color="#60a5fa" fill="#60a5fa" />
            </View>

          </View>
        </CloudBackground>
      </View>

      {/* Content Area (Below Clouds) */}
      <View
        className="flex-1 px-6 pb-8 z-20"
        style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 24 }}
      >
        {/* Spacer to push content to bottom when possible */}
        <View className="flex-1" />

        <View className="items-center gap-3 mb-4">

          <Text className="text-4xl font-extrabold leading-tight text-slate-400">
            Lobe
          </Text>
          <Text className="text-4xl font-extrabold text-center leading-tight text-foreground">
            {t('unauth.landing.title')}
          </Text>
          <Text className="text-xl text-muted-foreground text-center px-4">
            {t('unauth.landing.subtitle')}
          </Text>
        </View>

        <View className="gap-4 w-full">
          {/* Primary Action - Default (Orange) to match Lumosity */}
          <Button
            className="w-full h-12 native:h-16 px-10 rounded-2xl"
            onPress={() => router.push("/(unauthenticated)/SignUp")}
          >
            <Text className="font-bold text-2xl text-primary-foreground">{t('unauth.landing.get_started')}</Text>
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 native:h-16 px-10 rounded-2xl border-2"
            onPress={() => router.push("/(unauthenticated)/SignUp")}
          >
            <Text className="font-bold text-2xl text-primary">{t('unauth.landing.login')}</Text>
          </Button>
        </View>

        {/* Legal Text */}
        <Text className="text-sm text-muted-foreground text-center px-8 leading-5 mt-4">
          {t('unauth.landing.legal')}
        </Text>
      </View>
    </View>
  );
}

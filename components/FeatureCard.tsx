import React from "react";
import { TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import { Lock } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { H4 } from "~/components/ui/typography";
import { useRevenueCat } from "~/contexts/RevenueCatProvider";
import { cn } from "~/lib/utils";

interface FeatureCardProps {
  title: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  isLocked?: boolean;
  noPadding?: boolean;
}

/**
 * FeatureCard - A locked premium feature card with blur overlay
 * automatically handles Pro status checks.
 */
export function FeatureCard({
  title,
  children,
  isLocked = false,
  noPadding = false,
}: FeatureCardProps) {
  const { t } = useTranslation();
  const { isPro, presentPaywall } = useRevenueCat();

  // Logic: Locked if requested AND user is not pro
  const isGated = isLocked && !isPro;
  // Show Pro badge if it IS a locked feature but user HAS access
  const showProBadge = isLocked && isPro;

  return (
    <Card className="mb-6 bg-card overflow-hidden">
      {/* Header Section */}
      <View className="flex-row items-center justify-between px-4 pt-4">
        <View className="flex-row items-center gap-2">
          {/* Optional: Add an icon here if passed in props later */}
          <H4 className="text-base font-black uppercase tracking-wider text-foreground/80">
            {title}
          </H4>
        </View>

        {/* Right Action/Badge */}
        {isGated ? (
          <TouchableOpacity
            onPress={() => presentPaywall()}
            className="bg-primary px-3 py-1.5 rounded-full flex-row items-center gap-1.5 shadow-sm"
          >
            <Text className="text-white font-black text-xs">
              {t("feature_card.unlock")}
            </Text>
            <Lock size={12} color="white" strokeWidth={3} />
          </TouchableOpacity>
        ) : showProBadge ? (
          <View className="bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20">
            <Text className="text-secondary font-black text-[10px]">
              {t("feature_card.pro")}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="relative">
        {/* Main Content */}
        <View
          className={cn(
            noPadding ? "px-0 py-2" : "p-4 pb-2",
            isGated && "opacity-50",
          )}
        >
          {children}
        </View>

        {/* Locked Overlay */}
        {isGated && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => presentPaywall()}
            className="absolute inset-0 overflow-hidden rounded-b-xl"
          >
            <BlurView
              intensity={15}
              tint="light"
              className="absolute inset-0"
            />
            <View className="absolute inset-0 items-center justify-center p-6">
              <View className="items-center gap-3">
                <View className="bg-transparent p-3 rounded-full shadow-sm">
                  <Lock size={24} className="text-primary" />
                </View>
                <Text className="text-center font-bold text-foreground/80 text-sm">
                  {t("feature_card.premium_msg")}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

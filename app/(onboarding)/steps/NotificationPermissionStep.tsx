import { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { useNotifications } from "~/contexts/NotificationProvider";
import { CustomStepProps } from "../index";

export default function NotificationPermissionStep({
  onNext,
}: CustomStepProps) {
  const { t } = useTranslation();
  const { requestPermission } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const granted = await requestPermission();
      // We proceed regardless of the result, as the user has made a choice (or system logic ran)
      // Ideally we might want to show a specialized message if denied, but standard flow is just to move on.
      onNext();
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      onNext(); // Proceed even on error to not block flow
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <View className="flex-1 bg-background justify-between p-6 safe-area-view">
      <View className="flex-1 items-center justify-center">
        <Animated.View
          entering={ZoomIn.duration(600).springify()}
          className="mb-8 items-center justify-center"
        >
          <Image
            source={require("~/assets/images/brain_notifications.png")}
            style={{
              width: 280,
              height: 280,
              resizeMode: "contain",
              zIndex: 100,
            }}
            cachePolicy="memory"
          />
          <View className="absolute">
            <Svg
              width={340}
              height={300}
              viewBox="0 0 340 300"
              style={{ transform: [{ rotate: "-14deg" }] }}
            >
              <Path
                d="M52,78
           C18,130 40,220 120,250
           C200,280 310,230 300,150
           C290,70 190,20 120,40
           C80,50 65,60 52,78 Z"
                fill="#fe7939"
                opacity={0.9}
              />
            </Svg>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).duration(600)}>
          <Text className="text-3xl font-extrabold text-center text-foreground mb-4">
            {t("onboarding.steps.notifications.title")}
          </Text>
          <Text className="text-lg text-muted-foreground text-center px-4">
            {t("onboarding.steps.notifications.description")}
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(800).duration(600)}>
        <Button
          className="w-full rounded-2xl h-12 native:h-16"
          onPress={handleEnable}
        >
          <Text className="font-bold text-xl text-primary-foreground">
            {isLoading
              ? t("common.loading")
              : t("onboarding.steps.notifications.enable_button")}
          </Text>
        </Button>

        <Button
          onPress={handleSkip}
          variant="link"
          className="w-full"
          disabled={isLoading}
        >
          <Text className="text-muted-foreground">
            {t("onboarding.steps.notifications.skip_button")}
          </Text>
        </Button>
      </Animated.View>
    </View>
  );
}

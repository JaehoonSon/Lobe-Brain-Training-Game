import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-background p-4 gap-4">
      <Text className="text-2xl font-bold">{t("unauth.landing.login")}</Text>
      <Text className="text-muted-foreground">{t("common.loading")}</Text>
      <Button
        onPress={() => router.back()}
        variant="outline"
        className="h-12 px-8"
      >
        <Text className="text-foreground font-bold">{t("common.cancel")}</Text>
      </Button>
    </View>
  );
}

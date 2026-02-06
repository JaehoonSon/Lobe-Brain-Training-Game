import { View } from "react-native";
import { Link, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "~/components/ui/text";

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("not_found.title") }} />
      <View>
        <Text>{t("not_found.message")}</Text>

        <Link href="/">
          <Text>{t("not_found.go_home")}</Text>
        </Link>
      </View>
    </>
  );
}

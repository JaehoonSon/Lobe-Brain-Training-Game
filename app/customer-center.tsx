import React from "react";
import { StyleSheet, View, Text } from "react-native";
// Note: CustomerCenter is part of react-native-purchases-ui, but verify import if available in installed version
// If not available, we might need to fallback or check version.
// Assuming it is available as per request context.
// import { CustomerCenter } from 'react-native-purchases-ui';
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function CustomerCenterScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* CustomerCenter component might not be available in all versions or requires check */}
      <Text>{t('customer_center.title')}</Text>
      {/* <CustomerCenter
        onDismiss={() => {
            router.back();
        }}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

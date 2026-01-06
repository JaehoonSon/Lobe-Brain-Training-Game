import React from "react";
import { useRouter } from "expo-router";
import Paywall from "~/components/Paywall";

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <Paywall
      onPurchaseCompleted={() => router.replace("/(authenticated)/(tabs)")}
      onRestoreCompleted={() => router.replace("/(authenticated)/(tabs)")}
      onDismiss={() => router.replace("/(authenticated)/(tabs)")}
    />
  );
}

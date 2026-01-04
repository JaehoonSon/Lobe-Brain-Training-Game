import React from "react";
import { useRouter } from "expo-router";
import Paywall from "~/components/Paywall";

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <Paywall
      onPurchaseCompleted={() => router.back()}
      onRestoreCompleted={() => router.back()}
      onDismiss={() => router.back()}
    />
  );
}

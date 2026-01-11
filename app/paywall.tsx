import React from "react";
import { useRouter } from "expo-router";
import Paywall from "~/components/Paywall";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { useRevenueCat } from "~/contexts/RevenueCatProvider";

export default function PaywallScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { isPro } = useRevenueCat();

  return (
    <Paywall
      onPurchaseCompleted={async () => {
        await completeOnboarding();
      }}
      onRestoreCompleted={async () => {
        // Only complete onboarding if restore was actually successful
        if (isPro) {
          await completeOnboarding();
        }
      }}
      onDismiss={async () => {
        await completeOnboarding();
      }}
    />
  );
}

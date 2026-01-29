import React from "react";
import { useRouter } from "expo-router";
import Paywall from "~/components/Paywall";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { useRevenueCat } from "~/contexts/RevenueCatProvider";
import { CustomStepProps } from "~/app/(onboarding)/index";

interface PaywallScreenProps extends Partial<CustomStepProps> {}

export default function PaywallScreen({ onNext }: PaywallScreenProps) {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { isPro } = useRevenueCat();

  const handleComplete = async () => {
    await completeOnboarding();
    // If we have onNext (from onboarding flow), it's already handled by completeOnboarding
    // which redirects to home. Otherwise router.back() for standalone paywall presentation.
  };

  return (
    <Paywall
      onPurchaseCompleted={handleComplete}
      onRestoreCompleted={async () => {
        // Only complete onboarding if restore was actually successful
        if (isPro) {
          await handleComplete();
        }
      }}
      onDismiss={handleComplete}
    />
  );
}

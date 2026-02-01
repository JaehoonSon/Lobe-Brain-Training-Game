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
    console.log("PaywallScreen: handleComplete called");
    await completeOnboarding();
    // If we have onNext (from onboarding flow), it's already handled by completeOnboarding
    // which redirects to home. Otherwise router.back() for standalone paywall presentation.
  };

  return (
    <Paywall
      onPurchaseCompleted={handleComplete}
      onRestoreCompleted={async () => {
        console.log("PaywallScreen: onRestoreCompleted called, isPro:", isPro);
        // Only complete onboarding if restore was actually successful
        if (isPro) {
          console.log(
            "PaywallScreen: Restore successful, completing onboarding",
          );
          await handleComplete();
        } else {
          console.log("PaywallScreen: Restore failed or not pro after restore");
        }
      }}
      onDismiss={() => {
        console.log("PaywallScreen: onDismiss called");
        handleComplete();
      }}
    />
  );
}

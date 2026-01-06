import React from "react";
import { useRouter } from "expo-router";
import Paywall from "~/components/Paywall";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

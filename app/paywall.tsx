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
    <View className="flex-1">
      <Paywall
        onPurchaseCompleted={() => router.back()}
        onRestoreCompleted={() => router.back()}
        onDismiss={() => router.back()}
      />
      <SafeAreaView className="absolute top-0 right-0 p-4" edges={["top"]}>
        <Button
          variant="ghost"
          size="icon"
          onPress={() => router.back()}
          className="bg-black/20 rounded-full"
        >
          <X className="text-white" size={24} />
        </Button>
      </SafeAreaView>
    </View>
  );
}

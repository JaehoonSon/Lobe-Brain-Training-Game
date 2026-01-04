import { CustomStepProps } from "~/app/(onboarding)/index";
import { View, Image, ImageSourcePropType } from "react-native";
import { Text } from "~/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";

export interface GameConfig {
  type: "mental_arithmetic";
}

export interface GameStepProps extends CustomStepProps {
  gameConfig: GameConfig;
}

export function GameStep({ onNext, onBack, gameConfig }: GameStepProps) {
  if (gameConfig.type === "mental_arithmetic") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text>Game Step</Text>
        <Text>{gameConfig.type}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Text>Game Step</Text>
      <Text>{gameConfig.type}</Text>
    </View>
  );
}

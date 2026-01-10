import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";

export default function LoginScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-background p-4 gap-4">
            <Text className="text-2xl font-bold">Log In</Text>
            <Text className="text-muted-foreground">Placeholder for Login Flow</Text>
            <Button onPress={() => router.back()} variant="outline" className="h-12 px-8">
                <Text className="text-foreground font-bold">Go Back</Text>
            </Button>
        </View>
    );
}

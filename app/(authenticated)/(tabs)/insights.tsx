import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, P, Muted } from "~/components/ui/typography";
import { Card, CardContent } from "~/components/ui/card";
import { Lightbulb } from "lucide-react-native";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";

export default function InsightsScreen() {
    return (
        <SafeAreaView edges={["top"]} className="flex-1 bg-background">
            {/* Sticky Top Bar */}
            <View className="px-6 pt-2 pb-2 bg-background z-10">
                <AuthenticatedHeader />
            </View>

            <ScrollView
                className="flex-1 bg-background"
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="px-6 pb-6">
                    {/* Page Title */}
                    <H1 className="mb-6 pt-4 text-3xl font-black">Insights</H1>

                    {/* Coming Soon Card */}
                    <Card className="overflow-hidden">
                        <CardContent className="p-8 items-center gap-4">
                            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
                                <Lightbulb size={40} className="text-primary" />
                            </View>
                            <P className="text-xl font-black text-center">Coming Soon</P>
                            <Muted className="text-center text-base font-bold leading-6">
                                Personalized insights about your brain training progress will
                                appear here after you've completed more sessions.
                            </Muted>
                        </CardContent>
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

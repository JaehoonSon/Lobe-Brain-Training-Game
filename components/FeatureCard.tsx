import React from "react";
import { View } from "react-native";
import { BlurView } from "expo-blur";
import { Lock } from "lucide-react-native";
import { Card } from "~/components/ui/card";
import { H4 } from "~/components/ui/typography";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";

interface FeatureCardProps {
    title: string;
    children: React.ReactNode;
    variant?: "primary" | "secondary";
}

/**
 * FeatureCard - A locked premium feature card with blur overlay
 * Used on Stats page and Category detail pages
 */
export function FeatureCard({ title, children, variant = "primary" }: FeatureCardProps) {
    return (
        <Card className="mb-6 bg-card p-0">
            <View className="relative" style={{ overflow: "hidden", borderRadius: 10 }}>
                {/* 1. Underlying Content (to be blurred) */}
                <View>
                    {/* Header Area Spacer */}
                    <View className="px-4 pt-4 pb-2">
                        <View className="px-4 py-1.5 rounded-full opacity-0">
                            <H4 className="text-lg font-black leading-tight">{title}</H4>
                        </View>
                    </View>

                    {/* Body Content */}
                    <View className="p-4 pt-0">
                        <View className="px-2">
                            {children}
                        </View>
                        {/* Extra padding for the message center alignment */}
                        <View className="h-8" />
                    </View>
                </View>

                {/* 2. Global Blur - Now covers the whole card */}
                <BlurView
                    intensity={70}
                    tint="light"
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 10 }}
                />

                {/* 3. Floating Sharp Pill - On top of blur */}
                <View className="absolute top-4 left-4">
                    <View className={cn(
                        "px-4 py-1.5 rounded-full border-b-4",
                        variant === "primary" ? "bg-primary border-primary-edge" : "bg-secondary border-secondary-edge"
                    )}>
                        <H4 className="text-lg font-black text-white leading-tight">{title}</H4>
                    </View>
                </View>

                {/* 4. Minimal Unlock Message - High Contrast on Blur */}
                <View className="absolute inset-0 items-center justify-center p-8">
                    <View className="items-center gap-2">
                        <Lock size={20} className="text-primary-edge/60" strokeWidth={3} />
                        <Text className="text-primary-edge/80 text-center text-lg leading-tight max-w-[220px]">
                            This feature is available with a{"\n"}premium subscription
                        </Text>
                    </View>
                </View>
            </View>
        </Card>
    );
}

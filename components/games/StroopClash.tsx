
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, useWindowDimensions } from "react-native";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { StroopClashContent } from "~/lib/validators/game-content";
import { PaintBucket, Type } from "lucide-react-native";

interface StroopClashProps {
    onComplete: (accuracy: number, userResponse?: any) => void;
    content: StroopClashContent;
}

export function StroopClash({ onComplete, content }: StroopClashProps) {
    const { width } = useWindowDimensions();
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Helper to normalize hex to name for comparison if needed, 
    // but we can also store the name in the options and map it.
    const getInkName = (hex: string) => {
        const map: Record<string, string> = {
            '#FF0000': 'Red',
            '#0000FF': 'Blue',
            '#008000': 'Green',
            '#FFFF00': 'Yellow',
            '#800080': 'Purple',
            '#FFA500': 'Orange',
        };
        return map[hex.toUpperCase()] || 'Unknown';
    };

    const correctValue = content.task === "INK" ? getInkName(content.ink) : content.word;

    const handlePress = (option: string) => {
        if (hasAnswered) return;

        setHasAnswered(true);
        setSelectedOption(option);

        // Case-insensitive comparison
        const correct = option.toLowerCase() === correctValue.toLowerCase();

        if (correct) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        // Pass accuracy (1.0 or 0.0) and the user's choice back
        setTimeout(() => {
            onComplete(correct ? 1.0 : 0.0, { selected: option, correct: correctValue });
        }, 1000);
    };

    // Responsive button width: 2 options per row or flexible grid
    const buttonWidth = width > 500 ? 180 : (width - 64) / 2;

    return (
        <View className="flex-1 items-center justify-center p-6 bg-background">
            {/* Task Cue (Pill style from UI guidelines) */}
            <View className="mb-12 items-center">
                <View className={cn(
                    "flex-row items-center px-6 py-3 rounded-full border-b-4 gap-3",
                    content.task === "INK"
                        ? "bg-primary border-primary-edge"
                        : "bg-secondary border-secondary-edge"
                )}>
                    {content.task === "INK" ? (
                        <PaintBucket color="white" size={24} strokeWidth={3} />
                    ) : (
                        <Type color="white" size={24} strokeWidth={3} />
                    )}
                    <Text className="text-xl font-black text-white uppercase">
                        {content.task === "INK" ? "Tap the Color" : "Tap the Text"}
                    </Text>
                </View>
            </View>

            {/* Stimulus (The Clash) */}
            <View className="mb-20 min-h-[120px] justify-center">
                <Text
                    className="text-7xl font-black text-center"
                    style={{ color: content.ink, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 0 }}
                >
                    {content.word}
                </Text>
            </View>

            {/* Options Grid */}
            <View className="flex-row flex-wrap justify-center gap-4">
                {content.options.map((option) => {
                    const isSelected = selectedOption === option;
                    const isCorrectOption = option.toLowerCase() === correctValue.toLowerCase();

                    let stateStyles = "bg-card border-border border-b-4 active:border-b-0 active:translate-y-1";
                    let textStyle = "text-card-foreground";

                    if (hasAnswered) {
                        if (isCorrectOption) {
                            stateStyles = "bg-green-500 border-green-600 border-b-4";
                            textStyle = "text-white";
                        } else if (isSelected) {
                            stateStyles = "bg-destructive border-destructive-edge border-b-4";
                            textStyle = "text-white";
                        } else {
                            stateStyles = "bg-card border-border border-b-4 opacity-20";
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={option}
                            activeOpacity={0.8}
                            onPress={() => handlePress(option)}
                            disabled={hasAnswered}
                            className={cn(
                                "rounded-3xl items-center justify-center transition-all duration-200",
                                stateStyles
                            )}
                            style={{ width: buttonWidth, height: 100 }}
                        >
                            <Text className={cn("text-2xl font-black", textStyle)}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

import React, { useState, useEffect, useMemo } from "react";
import { View, TouchableOpacity, useWindowDimensions } from "react-native";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { OddOneOutContent } from "~/lib/validators/game-content";

interface OddOneOutProps {
  onComplete: (accuracy: number) => void;
  content: OddOneOutContent;
}

export function OddOneOut({ onComplete, content }: OddOneOutProps) {
  const { width } = useWindowDimensions();
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Determine the correct index randomly once per content
  const correctIndex = useMemo(() => {
    const totalItems = content.rows * content.cols;
    return Math.floor(Math.random() * totalItems);
  }, [content]);

  // Reset state when content changes
  useEffect(() => {
    setHasAnswered(false);
    setSelectedIndex(null);
  }, [content]);

  const handlePress = (index: number) => {
    if (hasAnswered) return;

    const isCorrect = index === correctIndex;
    setHasAnswered(true);
    setSelectedIndex(index);

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      onComplete(isCorrect ? 1.0 : 0.0);
    }, 500); // Quick transition
  };

  // Calculate grid item size dynamically
  // Container padding = 24 (p-6) * 2 = 48
  // Gap = 8 (gap-2) * (cols - 1)
  const availableWidth = width - 48;
  const gapSize = 8;
  const totalGapSpace = gapSize * (content.cols - 1);
  const itemSize = (availableWidth - totalGapSpace) / content.cols;
  
  // Font size adjustment based on grid density
  const fontSize = content.cols > 6 ? "text-xl" : content.cols > 4 ? "text-3xl" : "text-4xl";

  return (
    <View className="flex-1 items-center justify-center p-6 bg-background">
      <View className="mb-8">
        <Text className="text-xl text-center text-muted-foreground font-medium">
          Find the odd emoji out!
        </Text>
      </View>

      <View 
        style={{ 
          width: availableWidth,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: gapSize,
          justifyContent: 'center'
        }}
      >
        {Array.from({ length: content.rows * content.cols }).map((_, i) => {
          const isTarget = i === correctIndex;
          const char = isTarget ? content.target : content.distractor;
          
          let itemStyle = "bg-card border-border border-b-4";
          let translateY = 0;
          
          if (hasAnswered) {
             if (isTarget) {
                 itemStyle = "bg-green-500 border-green-600 border-b-0";
                 translateY = 4;
             } else if (i === selectedIndex) {
                 itemStyle = "bg-destructive border-destructive-edge border-b-0";
                 translateY = 4;
             } else {
                 itemStyle = "bg-card border-border opacity-30 border-b-4";
             }
          }

          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => handlePress(i)}
              disabled={hasAnswered}
              style={{
                width: itemSize,
                height: itemSize,
                transform: [{ translateY }]
              }}
              className={cn(
                "items-center justify-center rounded-xl",
                itemStyle
              )}
            >
              <Text className={cn("font-black text-card-foreground", fontSize, hasAnswered && isTarget && "text-white")}>
                {char}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

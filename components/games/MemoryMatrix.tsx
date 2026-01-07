import React, { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { MemoryMatrixContent } from "~/lib/validators/game-content";

interface MemoryMatrixProps {
  onComplete: (isCorrect: boolean) => void;
  content: MemoryMatrixContent;
}

type TileState = "hidden" | "active" | "correct" | "incorrect" | "missed";
type GamePhase = "memorize" | "recall" | "result";

export function MemoryMatrix({ onComplete, content }: MemoryMatrixProps) {
  const [gridSize, setGridSize] = useState(content.grid_size.rows); // Assuming square for now or handle rows/cols in render
  const [activeTiles, setActiveTiles] = useState<number[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [phase, setPhase] = useState<GamePhase>("memorize");

  // Reset when content changes
  useEffect(() => {
    setGridSize(content.grid_size.rows);
    generateLevel();
  }, [content]);

  const generateLevel = useCallback(() => {
    // Generate random unique tiles
    const totalTiles = content.grid_size.rows * content.grid_size.cols;
    const newActiveTiles: number[] = [];
    while (newActiveTiles.length < content.target_count) {
      const tileIndex = Math.floor(Math.random() * totalTiles);
      if (!newActiveTiles.includes(tileIndex)) {
        newActiveTiles.push(tileIndex);
      }
    }
    setActiveTiles(newActiveTiles);
    setSelectedTiles([]);
    setPhase("memorize");

    // Switch to recall phase after time
    setTimeout(() => {
      setPhase("recall");
    }, content.display_time_ms);
  }, [content]);

  const handleTilePress = (index: number) => {
    if (phase !== "recall") return;
    if (selectedTiles.includes(index)) return;

    const newSelected = [...selectedTiles, index];
    setSelectedTiles(newSelected);
    Haptics.selectionAsync();

    if (newSelected.length === content.target_count) {
      checkResult(newSelected);
    }
  };

  const checkResult = (selections: number[]) => {
    setPhase("result");

    // Check correctness
    const allCorrect =
      selections.every((s) => activeTiles.includes(s)) &&
      selections.length === activeTiles.length;

    if (allCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      onComplete(allCorrect);
    }, 1500); // Wait a bit to show the result
  };

  const getTileState = (index: number): TileState => {
    if (phase === "memorize") {
      return activeTiles.includes(index) ? "active" : "hidden";
    }

    if (phase === "recall") {
      return selectedTiles.includes(index) ? "active" : "hidden";
    }

    if (phase === "result") {
      const isSelected = selectedTiles.includes(index);
      const isActive = activeTiles.includes(index);

      if (isSelected && isActive) return "correct";
      if (isSelected && !isActive) return "incorrect";
      if (!isSelected && isActive) return "missed";
    }

    return "hidden";
  };

  // Dynamic grid sizing logic can be improved, roughly scaled for now
  // Assumes square-ish grid for visual simplicity or uses rows/cols
  const rows = content.grid_size.rows;
  const cols = content.grid_size.cols;

  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="mb-12 items-center">
        <Text className="text-5xl font-extrabold mb-4 text-center">
          Memory Matrix
        </Text>
        <Text className="text-xl text-muted-foreground text-center">
          {phase === "memorize" && "Remember the pattern..."}
          {phase === "recall" && "Reproduce the pattern"}
          {phase === "result" && "Checking..."}
        </Text>
      </View>

      <View
        className="flex-row flex-wrap justify-center gap-4"
        style={{ width: cols * 80 + (cols - 1) * 16 }} // Scaled sizing (80px tiles + 16px gap)
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const state = getTileState(i);

          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              onPress={() => handleTilePress(i)}
              className={cn(
                "w-20 h-20 rounded-2xl border-4 transition-all duration-200",
                // Default state (hidden)
                state === "hidden" && "bg-card border-border",
                // Active (memorize phase or recall selection)
                state === "active" && "bg-primary border-primary",
                // Correct (result)
                state === "correct" && "bg-green-500 border-green-600",
                // Incorrect (result)
                state === "incorrect" && "bg-destructive border-destructive",
                // Missed (result)
                state === "missed" &&
                  "bg-yellow-400 border-yellow-500 opacity-50"
              )}
              disabled={phase !== "recall"}
            />
          );
        })}
      </View>
    </View>
  );
}

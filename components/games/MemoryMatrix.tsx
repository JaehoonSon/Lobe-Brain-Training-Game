import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { MemoryMatrixContent } from "~/lib/validators/game-content";

interface MemoryMatrixProps {
  onComplete: (isCorrect: boolean) => void;
  content: MemoryMatrixContent;
  difficulty?: number;
}

type TileState = "hidden" | "active" | "correct" | "incorrect" | "missed";
type GamePhase = "memorize" | "recall" | "result";

/**
 * Generate random target tiles based on content params.
 * This is called once per game session.
 */
function generateTargets(
  rows: number,
  cols: number,
  targetCount: number
): number[] {
  const totalTiles = rows * cols;
  const targets = new Set<number>();

  while (targets.size < targetCount && targets.size < totalTiles) {
    const randomIndex = Math.floor(Math.random() * totalTiles);
    targets.add(randomIndex);
  }

  return Array.from(targets);
}

export function MemoryMatrix({ onComplete, content, difficulty = 1 }: MemoryMatrixProps) {
  const [phase, setPhase] = useState<GamePhase>("memorize");
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const hasInitialized = useRef(false);

  // Generate random targets once when content changes
  const [activeTiles, setActiveTiles] = useState<number[]>([]);

  const rows = content.grid_size.rows;
  const cols = content.grid_size.cols;
  const targetCount = content.target_count;
  const displayTimeMs = content.display_time_ms;

  // Initialize game on mount/content change
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      // Generate random tiles
      const targets = generateTargets(rows, cols, targetCount);
      setActiveTiles(targets);

      // Reset UI state
      setPhase("memorize");
      setSelectedTiles([]);
    }
  }, [content, rows, cols, targetCount]);

  // Phase timer (memorize -> recall)
  useEffect(() => {
    if (phase === "memorize" && activeTiles.length > 0) {
      const timer = setTimeout(() => {
        setPhase("recall");
      }, displayTimeMs);

      return () => clearTimeout(timer);
    }
  }, [phase, activeTiles.length, displayTimeMs]);

  const handleTilePress = (index: number) => {
    if (phase !== "recall") return;
    if (selectedTiles.includes(index)) return;

    const newSelected = [...selectedTiles, index];
    setSelectedTiles(newSelected);
    Haptics.selectionAsync();

    // Check if finished
    if (newSelected.length === targetCount) {
      checkResult(newSelected);
    }
  };

  const checkResult = (selections: number[]) => {
    setPhase("result");

    const correctPicks = selections.filter(s => activeTiles.includes(s)).length;
    const accuracy = correctPicks / targetCount;
    const isPerfect = accuracy === 1.0;

    if (isPerfect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Notify Parent after delay
    setTimeout(() => {
      onComplete(isPerfect);
    }, 1500);
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

  // Show loading if targets not yet generated
  if (activeTiles.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="mb-12 items-center">
        <Text className="text-5xl font-extrabold mb-4 text-center">
          Memory Matrix
        </Text>
        <Text className="text-xl text-muted-foreground text-center">
          {phase === "memorize" && "Remember the pattern..."}
          {phase === "recall" && `Select ${targetCount} tiles`}
          {phase === "result" && "Checking..."}
        </Text>
      </View>

      <View
        className="flex-row flex-wrap justify-center gap-3"
        style={{ width: cols * 72 + (cols - 1) * 12 }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const state = getTileState(i);

          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              onPress={() => handleTilePress(i)}
              className={cn(
                "w-16 h-16 rounded-xl border-4 transition-all duration-200",
                state === "hidden" && "bg-card border-border",
                state === "active" && "bg-primary border-primary",
                state === "correct" && "bg-green-500 border-green-600",
                state === "incorrect" && "bg-destructive border-destructive",
                state === "missed" && "bg-yellow-400 border-yellow-500 opacity-50"
              )}
              disabled={phase !== "recall"}
            />
          );
        })}
      </View>

      {phase === "recall" && (
        <Text className="mt-6 text-muted-foreground">
          {selectedTiles.length} / {targetCount} selected
        </Text>
      )}
    </View>
  );
}

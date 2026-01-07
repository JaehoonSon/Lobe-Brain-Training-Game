import React, { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { MemoryMatrixInstance } from "~/lib/generators/memoryMatrix";
import { useGameSession } from "~/hooks/useGameSession";
import { supabase } from "~/lib/supabase";

interface MemoryMatrixProps {
  onComplete: (isCorrect: boolean) => void;
  content: MemoryMatrixInstance;
  onExit?: () => void;
}

type TileState = "hidden" | "active" | "correct" | "incorrect" | "missed";
type GamePhase = "memorize" | "recall" | "result";

export function MemoryMatrix({ onComplete, content, onExit }: MemoryMatrixProps) {
  const [phase, setPhase] = useState<GamePhase>("memorize");
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const { state: session, startGame, endGame } = useGameSession();
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize User (in a real app, this comes from context)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || "anon");
    });
  }, []);

  // Start the Game Session
  useEffect(() => {
    if (userId && !session.isPlaying && !session.isFinished) {
      startGame(
        {
          gameId: "memory_matrix",
          difficulty: content.difficulty,
          userId: userId,
          metadata: { mode: "standard" },
        },
        content
      );

      // Visual Phase Logic
      setPhase("memorize");
      setSelectedTiles([]);

      // Timer for memorization phase
      const timer = setTimeout(() => {
        setPhase("recall");
      }, 2000); // Default 2s for now, or use content.targetTimeMs logic if applicable strictly for display

      return () => clearTimeout(timer);
    }
  }, [content, userId, startGame, session.isPlaying, session.isFinished]);

  const activeTiles = content.targets.map(t => t.row * content.gridSize + t.col);

  const handleTilePress = (index: number) => {
    if (phase !== "recall") return;
    if (selectedTiles.includes(index)) return;

    const newSelected = [...selectedTiles, index];
    setSelectedTiles(newSelected);
    Haptics.selectionAsync();

    // Check if finished
    if (newSelected.length === content.targets.length) {
      checkResult(newSelected);
    }
  };

  const checkResult = (selections: number[]) => {
    setPhase("result");

    const correctPicks = selections.filter(s => activeTiles.includes(s)).length;
    const totalTargets = activeTiles.length;
    const accuracy = correctPicks / totalTargets;

    // Determine strict correctness (for haptics/ui)
    const isPerfect = accuracy === 1.0;

    if (isPerfect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // End Session (Calculates BPI and Syncs)
    // We pass the selection details for replay
    endGame(accuracy, {
      selectedIndices: selections,
      targetIndices: activeTiles
    });

    // Notify Parent after delay
    setTimeout(() => {
      onComplete(isPerfect);
    }, 2000);
  };

  const getTileState = (index: number): TileState => {
    // 1. Memorize Phase: Show targets
    if (phase === "memorize") {
      return activeTiles.includes(index) ? "active" : "hidden";
    }

    // 2. Recall Phase: Show what user clicked
    if (phase === "recall") {
      return selectedTiles.includes(index) ? "active" : "hidden";
    }

    // 3. Result Phase: Show Truth vs Selection
    if (phase === "result") {
      const isSelected = selectedTiles.includes(index);
      const isActive = activeTiles.includes(index);

      if (isSelected && isActive) return "correct";     // Found it
      if (isSelected && !isActive) return "incorrect";  // Wrong click
      if (!isSelected && isActive) return "missed";     // Forgot it
    }

    return "hidden";
  };

  const rows = content.gridSize;
  const cols = content.gridSize;

  if (session.isFinished && session.score !== null) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-3xl font-bold mb-2">Round Complete</Text>
        <Text className="text-xl text-muted-foreground mb-8">Score Calculation...</Text>

        <View className="bg-card p-6 rounded-xl w-full max-w-sm items-center border border-border">
          <Text className="text-sm text-muted-foreground uppercase tracking-widest mb-2">BPI Score</Text>
          <Text className="text-6xl font-black text-primary mb-4">{session.score}</Text>

          <View className="flex-row gap-4 w-full justify-between">
            <View>
              <Text className="text-xs text-muted-foreground">Accuracy</Text>
              <Text className="font-bold">{Math.round((selectedTiles.filter(s => activeTiles.includes(s)).length / activeTiles.length) * 100)}%</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Time</Text>
              <Text className="font-bold">{(session.durationMs / 1000).toFixed(1)}s</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Diff</Text>
              <Text className="font-bold">{content.difficulty}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

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
        style={{ width: cols * 80 + (cols - 1) * 16 }} // Scaled sizing
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
    </View>
  );
}

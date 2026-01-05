import React, { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";

interface MemoryMatrixProps {
    onComplete: (isCorrect: boolean) => void;
    difficulty?: "easy" | "medium" | "hard";
}

type TileState = "hidden" | "active" | "correct" | "incorrect" | "missed";
type GamePhase = "memorize" | "recall" | "result";

export function MemoryMatrix({
    onComplete,
    difficulty = "easy",
}: MemoryMatrixProps) {
    const [gridSize, setGridSize] = useState(3);
    const [activeTiles, setActiveTiles] = useState<number[]>([]);
    const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
    const [phase, setPhase] = useState<GamePhase>("memorize");

    // Configuration based on difficulty
    const getLevelConfig = useCallback(() => {
        switch (difficulty) {
            case "medium":
                return { size: 4, count: 5, time: 1500 };
            case "hard":
                return { size: 5, count: 7, time: 1000 };
            case "easy":
            default:
                return { size: 4, count: 4, time: 2000 }; // 4 tiles on 4x4 grid
        }
    }, [difficulty]);

    const generateLevel = useCallback(() => {
        const config = getLevelConfig();
        setGridSize(config.size);

        // Generate random unique tiles
        const totalTiles = config.size * config.size;
        const newActiveTiles: number[] = [];
        while (newActiveTiles.length < config.count) {
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
        }, config.time);
    }, [getLevelConfig]);

    useEffect(() => {
        generateLevel();
    }, [generateLevel]);

    const handleTilePress = (index: number) => {
        if (phase !== "recall") return;
        if (selectedTiles.includes(index)) return;

        const newSelected = [...selectedTiles, index];
        setSelectedTiles(newSelected);
        Haptics.selectionAsync();

        // Check if this tap was correct or wrong? 
        // Usually memory matrix waits until you tap the number of active tiles.
        // Or it fails immediately on wrong tap? 
        // Let's go with "wait until total taps reached" to allow for "oops" if we wanted, 
        // but typically it's immediate feedback or batch feedback.
        // Let's do batch feedback when count is reached.

        const config = getLevelConfig();

        if (newSelected.length === config.count) {
            checkResult(newSelected);
        }
    };

    const checkResult = (selections: number[]) => {
        setPhase("result");

        // Check correctness
        const allCorrect = selections.every(s => activeTiles.includes(s)) && selections.length === activeTiles.length;

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

    return (
        <View className="flex-1 items-center justify-center p-6">
            <View className="mb-8 items-center">
                <Text className="text-2xl font-bold mb-2">Memory Matrix</Text>
                <Text className="text-muted-foreground text-center">
                    {phase === "memorize" && "Remember the pattern..."}
                    {phase === "recall" && "Reproduce the pattern"}
                    {phase === "result" && "Checking..."}
                </Text>
            </View>

            <View
                className="flex-row flex-wrap justify-center gap-2"
                style={{ width: gridSize * 70 + (gridSize - 1) * 8 }} // Approx sizing
            >
                {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                    const state = getTileState(i);

                    return (
                        <TouchableOpacity
                            key={i}
                            activeOpacity={0.8}
                            onPress={() => handleTilePress(i)}
                            className={cn(
                                "w-16 h-16 rounded-xl border-2 transition-all duration-200",
                                // Default state (hidden)
                                state === "hidden" && "bg-card border-border",
                                // Active (memorize phase or recall selection)
                                state === "active" && "bg-primary border-primary",
                                // Correct (result)
                                state === "correct" && "bg-green-500 border-green-600",
                                // Incorrect (result)
                                state === "incorrect" && "bg-destructive border-destructive",
                                // Missed (result)
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

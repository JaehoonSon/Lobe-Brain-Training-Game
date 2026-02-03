import React, { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { WordUnscrambleContent } from "~/lib/validators/game-content";
import { RefreshCw } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface WordUnscrambleProps {
  onComplete: (accuracy: number) => void;
  content: WordUnscrambleContent;
}

interface LetterTile {
  id: string;
  char: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function WordUnscramble({ onComplete, content }: WordUnscrambleProps) {
  const { t } = useTranslation();
  const [targetWord, setTargetWord] = useState<string>("");
  const [scrambledPool, setScrambledPool] = useState<LetterTile[]>([]);
  const [placedLetters, setPlacedLetters] = useState<(LetterTile | null)[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Initialize game
  useEffect(() => {
    const word = content.word.toUpperCase();
    setTargetWord(word);
    setPlacedLetters(Array(word.length).fill(null));
    setIsSuccess(false);
    setIsError(false);
    setAttempts(0);
    shuffleLetters(word);
  }, [content]);

  const shuffleLetters = (word: string) => {
    const tiles: LetterTile[] = word.split("").map((char, i) => ({
      id: `${char}-${i}-${Math.random()}`,
      char,
    }));

    // Fisher-Yates shuffle
    let shuffled = [...tiles];
    // Ensure it's not the same as the original word if length > 1
    if (shuffled.length > 1) {
      let isSame = true;
      while (isSame) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        isSame = shuffled.map((t) => t.char).join("") === word;
      }
    }

    setScrambledPool(shuffled);
  };

  const handlePoolLetterPress = (tile: LetterTile) => {
    if (isSuccess) return;

    // Check if already placed -> Deselect if so
    const placedIndex = placedLetters.findIndex((l) => l?.id === tile.id);
    if (placedIndex !== -1) {
      Haptics.selectionAsync();
      setPlacedLetters((prev) => {
        const unique = [...prev];
        unique[placedIndex] = null;
        return unique;
      });
      return;
    }

    // Find first empty slot
    const emptyIndex = placedLetters.findIndex((l) => l === null);
    if (emptyIndex === -1) return; // Full

    Haptics.selectionAsync();

    // Add to placed letters
    setPlacedLetters((prev) => {
      const unique = [...prev];
      unique[emptyIndex] = tile;
      return unique;
    });

    // Reset error state on interaction
    if (isError) setIsError(false);
  };

  const handlePlacedLetterPress = (index: number) => {
    if (isSuccess) return;
    const tile = placedLetters[index];
    if (!tile) return;

    Haptics.selectionAsync();

    // Return to pool (just remove from slots)
    setPlacedLetters((prev) => {
      const unique = [...prev];
      unique[index] = null; // Remove from slot
      return unique;
    });

    if (isError) setIsError(false);
  };

  // Check for completion
  useEffect(() => {
    const isFull = placedLetters.every((l) => l !== null);
    if (isFull && targetWord && !isSuccess) {
      const currentWord = placedLetters.map((l) => l?.char).join("");

      if (currentWord === targetWord) {
        // Success
        setIsSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Calculate penalized accuracy: 100% minus 10% per failed attempt, floor at 10%
        const penalty = attempts * 0.1;
        const accuracy = Math.max(0.1, 1.0 - penalty);

        setTimeout(() => {
          onComplete(accuracy);
        }, 1000);
      } else {
        // Error
        setIsError(true);
        setAttempts((p) => p + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [placedLetters, targetWord, isSuccess, onComplete]);

  const tileSize = Math.min(50, (SCREEN_WIDTH - 40) / (targetWord.length || 5));

  // Helper to check if a tile is currently placed
  const isPlaced = (tileId: string) =>
    placedLetters.some((l) => l?.id === tileId);

  return (
    <View className="flex-1 items-center py-10 px-4">
      {/* Top Section: Hint and Slots */}
      <View className="flex-1 items-center justify-center w-full gap-8">
        {content.hint && (
          <View className="bg-secondary/10 px-4 py-2 rounded-lg">
            <Text className="text-secondary text-center text-lg italic">
              "{content.hint}"
            </Text>
          </View>
        )}

        {/* Target Slots */}
        <View className="flex-row gap-2 flex-wrap justify-center">
          {placedLetters.map((tile, index) => (
            <TouchableOpacity
              key={`slot-${index}`}
              activeOpacity={0.8}
              onPress={() => handlePlacedLetterPress(index)}
              disabled={tile === null}
              className={cn(
                "border-b-4 items-center justify-center transition-colors",
                tile
                  ? "border-primary bg-background"
                  : "border-muted-foreground/30",
                isError && "border-red-500",
                isSuccess && "border-green-500",
              )}
              style={{
                width: tileSize,
                height: tileSize * 1.2,
              }}
            >
              {tile && (
                <Text
                  className={cn(
                    "text-3xl font-bold",
                    isError && "text-red-500",
                    isSuccess && "text-green-500",
                  )}
                >
                  {tile.char}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {isError && <Text className="text-red-500 font-medium">Try again</Text>}
      </View>

      {/* Bottom Section: Scrambled Pool */}
      <View className="w-full">
        <View className="flex-row flex-wrap justify-center gap-3">
          {scrambledPool.map((tile) => {
            const placed = isPlaced(tile.id);
            return (
              <TouchableOpacity
                key={tile.id}
                onPress={() => handlePoolLetterPress(tile)}
                // Disabled removed to allow toggling off
                className={cn(
                  "border rounded-xl items-center justify-center shadow-sm transition-all",
                  placed
                    ? "bg-primary border-primary scale-95" // Selected state with primary color
                    : "bg-card border-border active:scale-95", // Default state
                )}
                style={{
                  width: tileSize,
                  height: tileSize,
                }}
              >
                <Text
                  className={cn(
                    "text-2xl font-semibold",
                    placed ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {tile.char}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* <Text className="text-center text-muted-foreground mt-8 text-sm">
          Tap letters to form the word
        </Text> */}
      </View>
    </View>
  );
}

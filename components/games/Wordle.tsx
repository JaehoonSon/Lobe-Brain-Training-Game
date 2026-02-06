import React, { useState, useCallback } from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { WordleContent } from "~/lib/validators/game-content";
import { useTranslation } from "react-i18next";

interface WordleProps {
  onComplete: (accuracy: number) => void; // 0.0 to 1.0
  content: WordleContent;
}

type TileStatus = "empty" | "filled" | "correct" | "present" | "absent";
type KeyStatus = "unused" | "correct" | "present" | "absent";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_GAP = 6;

export function Wordle({ onComplete, content }: WordleProps) {
  const { t } = useTranslation();
  const targetWord = content.word.toUpperCase();
  const wordLength = targetWord.length;
  const maxGuesses = content.max_guesses;
  const tileSize = Math.min(60, (SCREEN_WIDTH - 60) / wordLength);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyStatus>>({});

  const evaluateGuess = useCallback(
    (guess: string): TileStatus[] => {
      const result: TileStatus[] = Array(wordLength).fill("absent");
      const targetLetters = targetWord.split("");
      const guessLetters = guess.split("");

      // First pass: mark correct letters
      guessLetters.forEach((letter, i) => {
        if (letter === targetLetters[i]) {
          result[i] = "correct";
          targetLetters[i] = ""; // Mark as used
        }
      });

      // Second pass: mark present letters
      guessLetters.forEach((letter, i) => {
        if (result[i] !== "correct") {
          const targetIndex = targetLetters.indexOf(letter);
          if (targetIndex !== -1) {
            result[i] = "present";
            targetLetters[targetIndex] = ""; // Mark as used
          }
        }
      });

      return result;
    },
    [targetWord],
  );

  const updateKeyStatuses = useCallback(
    (guess: string, statuses: TileStatus[]) => {
      setKeyStatuses((prev) => {
        const updated = { ...prev };
        guess.split("").forEach((letter, i) => {
          const newStatus = statuses[i] as KeyStatus;
          const currentStatus = updated[letter];
          // Priority: correct > present > absent > unused
          if (
            newStatus === "correct" ||
            (newStatus === "present" && currentStatus !== "correct") ||
            (newStatus === "absent" &&
              currentStatus !== "correct" &&
              currentStatus !== "present")
          ) {
            updated[letter] = newStatus;
          }
        });
        return updated;
      });
    },
    [],
  );

  // Calculate accuracy based on letter correctness
  const calculateAccuracy = useCallback(
    (allGuesses: string[], won: boolean): number => {
      if (won) {
        // Win bonus: base 50% + up to 50% based on efficiency (fewer guesses = better)
        const efficiency = 1 - (allGuesses.length - 1) / maxGuesses;
        return 0.5 + efficiency * 0.5;
      }

      // For losses, calculate based on the best guess's letter accuracy
      let bestGuessScore = 0;

      for (const guess of allGuesses) {
        const statuses = evaluateGuess(guess);
        let guessScore = 0;

        statuses.forEach((status) => {
          if (status === "correct") guessScore += 1.0;
          else if (status === "present") guessScore += 0.5;
          // absent = 0
        });

        const normalizedScore = guessScore / wordLength;
        bestGuessScore = Math.max(bestGuessScore, normalizedScore);
      }

      // Scale to 0-50% range for losses (never higher than a win)
      return bestGuessScore * 0.5;
    },
    [maxGuesses, wordLength, evaluateGuess],
  );

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== wordLength || gameOver) return;

    const statuses = evaluateGuess(currentGuess);
    updateKeyStatuses(currentGuess, statuses);

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    const isWin = currentGuess === targetWord;
    const isLoss = newGuesses.length >= maxGuesses && !isWin;

    if (isWin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGameOver(true);
      const accuracy = calculateAccuracy(newGuesses, true);
      setTimeout(() => onComplete(accuracy), 1500);
    } else if (isLoss) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameOver(true);
      const accuracy = calculateAccuracy(newGuesses, false);
      setTimeout(() => onComplete(accuracy), 1500);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [
    currentGuess,
    guesses,
    gameOver,
    targetWord,
    wordLength,
    maxGuesses,
    evaluateGuess,
    updateKeyStatuses,
    calculateAccuracy,
    onComplete,
  ]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameOver) return;

      Haptics.selectionAsync();

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "⌫") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (currentGuess.length < wordLength) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess, gameOver, submitGuess],
  );

  const getTileStatus = (rowIndex: number, colIndex: number): TileStatus => {
    if (rowIndex < guesses.length) {
      // Completed guess row
      const guess = guesses[rowIndex];
      const statuses = evaluateGuess(guess);
      return statuses[colIndex];
    } else if (rowIndex === guesses.length) {
      // Current guess row
      return colIndex < currentGuess.length ? "filled" : "empty";
    }
    return "empty";
  };

  const getTileLetter = (rowIndex: number, colIndex: number): string => {
    if (rowIndex < guesses.length) {
      return guesses[rowIndex][colIndex] || "";
    } else if (rowIndex === guesses.length) {
      return currentGuess[colIndex] || "";
    }
    return "";
  };

  const getKeyStatus = (key: string): KeyStatus => {
    if (key === "ENTER" || key === "⌫") return "unused";
    return keyStatuses[key] || "unused";
  };

  return (
    <View className="flex-1 items-center justify-between py-4">
      {/* Title */}
      {/* <View className="items-center mb-4">
        <Text className="text-4xl font-extrabold">Wordle</Text>
        <Text className="text-lg text-muted-foreground">
          Guess the 5-letter word
        </Text>
      </View> */}
      {/* Game Grid */}
      <View className="items-center justify-center flex-1">
        {Array.from({ length: maxGuesses }).map((_, rowIndex) => (
          <View
            key={rowIndex}
            className="flex-row"
            style={{ marginBottom: TILE_GAP }}
          >
            {Array.from({ length: wordLength }).map((_, colIndex) => {
              const status = getTileStatus(rowIndex, colIndex);
              const letter = getTileLetter(rowIndex, colIndex);

              return (
                <View
                  key={colIndex}
                  className={cn(
                    "items-center justify-center rounded-lg border-2",
                    status === "empty" && "bg-card border-border",
                    status === "filled" && "bg-card border-foreground",
                    status === "correct" && "bg-green-600 border-green-700",
                    status === "present" && "bg-yellow-500 border-yellow-600",
                    status === "absent" && "bg-zinc-600 border-zinc-700",
                  )}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    marginHorizontal: TILE_GAP / 2,
                  }}
                >
                  <Text
                    className={cn(
                      "text-2xl font-bold",
                      (status === "correct" ||
                        status === "present" ||
                        status === "absent") &&
                        "text-white",
                      (status === "empty" || status === "filled") &&
                        "text-foreground",
                    )}
                  >
                    {letter}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      {/* Game Over Message */}
      {gameOver && (
        <View className="absolute top-1/2 left-0 right-0 items-center">
          <View className="bg-black/80 px-6 py-3 rounded-xl">
            <Text className="text-white text-xl font-bold">
              {guesses[guesses.length - 1] === targetWord
                ? t("game.wordle.win")
                : t("game.wordle.lose", { word: targetWord })}
            </Text>
          </View>
        </View>
      )}
      {/* Keyboard */}
      <View className="w-full px-1 pb-2">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <View
            key={rowIndex}
            className="flex-row justify-center"
            style={{ marginVertical: 3 }}
          >
            {row.map((key) => {
              const status = getKeyStatus(key);
              const isWide = key === "ENTER" || key === "⌫";

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.7}
                  disabled={gameOver}
                  className={cn(
                    "items-center justify-center rounded-md mx-0.5",
                    status === "unused" && "bg-zinc-400 dark:bg-zinc-600",
                    status === "correct" && "bg-green-600",
                    status === "present" && "bg-yellow-500",
                    status === "absent" && "bg-zinc-700",
                  )}
                  style={{
                    width: isWide ? 55 : 32,
                    height: 50,
                  }}
                >
                  <Text
                    className={cn(
                      "font-bold",
                      isWide ? "text-xs" : "text-base",
                      status === "unused"
                        ? "text-black dark:text-white"
                        : "text-white",
                    )}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

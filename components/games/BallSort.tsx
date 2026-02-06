import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  TouchableOpacity,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import { BallSortContent } from "~/lib/validators/game-content";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BallSortProps {
  onComplete: (accuracy: number) => void;
  content: BallSortContent;
}

const BALL_COLORS = [
  "#EF4444", // Red 500
  "#3B82F6", // Blue 500
  "#22C55E", // Green 500
  "#EAB308", // Yellow 500
  "#A855F7", // Purple 500
  "#F97316", // Orange 500
  "#06B6D4", // Cyan 500
  "#EC4899", // Pink 500
  "#6366F1", // Indigo 500
  "#84CC16", // Lime 500
];

export function BallSort({ onComplete, content }: BallSortProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [tubes, setTubes] = useState<number[][]>([]); // Array of tubes, each containing color indices
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(
    null,
  );
  const [moves, setMoves] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);

  // Config
  const tubeCount = content.tubeCount;
  const capacityPerTube = content.capacityPerTube;
  const colorCount = content.colorCount;

  // Responsive Sizing
  const PADDING = 20;
  const GAP = 10;
  // Calculate max tube width based on available screen space
  const availableWidth = width - PADDING * 2 - (tubeCount - 1) * GAP;
  const rawTubeWidth = availableWidth / tubeCount;
  const tubeWidth = Math.min(60, Math.max(40, rawTubeWidth));
  const ballSize = tubeWidth - 8; // 4px padding each side

  // Initialize Game
  useEffect(() => {
    startNewGame();
  }, [content]);

  const startNewGame = useCallback(() => {
    // 1. Create sorted tubes
    let newTubes: number[][] = Array.from({ length: tubeCount }, () => []);

    // Fill first 'colorCount' tubes with sorted balls
    for (let i = 0; i < colorCount; i++) {
      for (let j = 0; j < capacityPerTube; j++) {
        newTubes[i].push(i); // Push color index 'i'
      }
    }

    // 2. Shuffle by simulating random valid moves
    // This ensures the level is solvable.
    // However, for pure randomness that is robust enough (and faster),
    // we can just shuffle all balls and distribute them, checking for solvability if we were advanced.
    // BUT the standard "solvable" generation usually involves reverse interaction or just random shuffle with sufficient empty space.
    // With 2 empty tubes, random shuffle is almost always solvable.
    // Let's do random shuffle for simplicity and better distribution.

    const allBalls: number[] = [];
    newTubes.forEach((t) => allBalls.push(...t));

    // Fisher-Yates shuffle logic moved to loop below

    // Distribute back to tubes (leaving last (tubeCount - colorCount) tubes empty usually,
    // but here we just fill tubes up to capacity until balls run out)
    // Actually, to make it fun, we should probably distribute among ALL tubes initially?
    // No, standard is: N full tubes, M empty tubes.
    // So we fill the first 'colorCount' tubes with the SHUFFLED balls.

    const shuffledTubes: number[][] = Array.from(
      { length: tubeCount },
      () => [],
    );
    let ballIdx = 0;

    // Keep shuffling until we get a non-solved state (unless it's impossible, e.g. 1 color)
    let attempts = 0;
    while (attempts < 10) {
      attempts++;

      // Fisher-Yates shuffle
      for (let i = allBalls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allBalls[i], allBalls[j]] = [allBalls[j], allBalls[i]];
      }

      ballIdx = 0;
      // Reset tubes
      shuffledTubes.forEach((t) => (t.length = 0));

      // Fill tubes
      for (let i = 0; i < colorCount; i++) {
        for (let j = 0; j < capacityPerTube; j++) {
          if (ballIdx < allBalls.length) {
            shuffledTubes[i].push(allBalls[ballIdx++]);
          }
        }
      }

      // Check if solved
      const isSolved = shuffledTubes.every((tube) => {
        if (tube.length === 0) return true;
        if (tube.length !== capacityPerTube) return false;
        const firstColor = tube[0];
        return tube.every((ball) => ball === firstColor);
      });

      if (!isSolved || colorCount <= 1) break;
    }

    setTubes(shuffledTubes);
    setSelectedTubeIndex(null);
    setMoves(0);
    setIsComplete(false);
  }, [tubeCount, capacityPerTube, colorCount]);

  const handleTubePress = (index: number) => {
    if (isComplete) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (selectedTubeIndex === null) {
      // Select if tube has balls
      if (tubes[index].length > 0) {
        setSelectedTubeIndex(index);
        Haptics.selectionAsync();
      }
    } else {
      if (selectedTubeIndex === index) {
        // Deselect
        setSelectedTubeIndex(null);
      } else {
        // Try Move
        attemptMove(selectedTubeIndex, index);
      }
    }
  };

  const attemptMove = (fromIndex: number, toIndex: number) => {
    const fromTube = tubes[fromIndex];
    const toTube = tubes[toIndex];

    if (fromTube.length === 0) {
      setSelectedTubeIndex(null);
      return;
    }

    const ballToMove = fromTube[fromTube.length - 1]; // Top ball
    const topBallAtDest = toTube.length > 0 ? toTube[toTube.length - 1] : null;

    // Rules:
    // 1. Destination has space
    // 2. Destination is empty OR top ball matches color
    const hasSpace = toTube.length < capacityPerTube;
    const isColorMatch = topBallAtDest === null || topBallAtDest === ballToMove;

    if (hasSpace && isColorMatch) {
      // EXECUTE MOVE
      const newTubes = [...tubes];
      newTubes[fromIndex] = [...fromTube];
      newTubes[toIndex] = [...toTube];

      newTubes[fromIndex].pop();
      newTubes[toIndex].push(ballToMove);

      setTubes(newTubes);
      setMoves((m) => m + 1);
      setSelectedTubeIndex(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      checkWinCondition(newTubes);
    } else {
      // Invalid Move
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSelectedTubeIndex(null); // Just deselect or maybe shake? Deselect is fine for MVP.
    }
  };

  const checkWinCondition = (currentTubes: number[][]) => {
    // Win if all tubes are either empty OR (full AND all same color)
    // Actually, normally just "contains only one color" is enough, doesn't HAVE to be full?
    // No, usually it must be full (all 4 balls of Red in one tube).
    // Let's stick to: If a tube has balls, it must be FULL and UNIFORM.

    const isWin = currentTubes.every((tube) => {
      if (tube.length === 0) return true; // Empty is valid
      if (tube.length !== capacityPerTube) return false; // Must be full

      const firstColor = tube[0];
      return tube.every((ball) => ball === firstColor); // All match
    });

    if (isWin) {
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        onComplete(1.0); // 100% completion
      }, 1500);
    }
  };

  return (
    <View className="flex-1 items-center justify-between py-8">
      {/* Header Info */}
      <View className="items-center space-y-2">
        {/* <Text className="text-xl font-bold">Sort the Balls</Text> */}
        <Text className="text-muted-foreground font-medium">
          {t("game.ball_sort.moves", { count: moves })}
        </Text>
      </View>

      {/* Game Area */}
      <View className="flex-1 items-center justify-center w-full px-4">
        <View className="flex-row flex-wrap justify-center gap-4">
          {/* We might need a better layout for many tubes. Flex-wrap is good. */}
          {tubes.map((tube, tubeIndex) => {
            const isSelected = selectedTubeIndex === tubeIndex;

            return (
              <TouchableOpacity
                key={tubeIndex}
                activeOpacity={0.8}
                onPress={() => handleTubePress(tubeIndex)}
                className={cn(
                  "items-center justify-end rounded-b-full border-2 bg-black/5 dark:bg-white/5",
                  isSelected
                    ? "border-primary"
                    : "border-zinc-300 dark:border-zinc-700",
                )}
                style={{
                  width: tubeWidth,
                  height: ballSize * capacityPerTube + 16, // precise height
                  paddingBottom: 4,
                }}
              >
                {/* Balls */}
                {tube.map((colorIndex, ballIndex) => {
                  const isTopBall = ballIndex === tube.length - 1;
                  const lifted = isSelected && isTopBall;

                  return (
                    <View
                      key={ballIndex}
                      className={cn("rounded-full absolute", "shadow-sm")}
                      style={{
                        width: ballSize,
                        height: ballSize,
                        backgroundColor:
                          BALL_COLORS[colorIndex % BALL_COLORS.length],
                        bottom: 4 + ballIndex * ballSize, // stack from bottom
                        transform: [{ translateY: lifted ? -20 : 0 }], // Lift effect
                      }}
                    />
                  );
                })}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

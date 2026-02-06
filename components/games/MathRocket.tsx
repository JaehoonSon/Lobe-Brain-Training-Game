import React, { useState, useEffect, useCallback } from "react";
import { View, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import * as Haptics from "expo-haptics";
import { MathRocketContent } from "~/lib/validators/game-content";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useFrameCallback,
  runOnJS,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const ROCKET_SIZE = 100;
const PLAYABLE_HEIGHT = height * 0.75;

interface MathRocketProps {
  onComplete: (accuracy: number) => void;
  content: MathRocketContent;
}

interface Question {
  num1: number;
  num2: number;
  operator: string;
  answer: number;
  choices: number[];
}

export function MathRocket({ onComplete, content }: MathRocketProps) {
  const [gameState, setGameState] = useState<"playing" | "game_over" | "won">(
    "playing",
  );
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const rocketY = useSharedValue(PLAYABLE_HEIGHT * 0.15);
  const velocity = useSharedValue(0);
  const isPlaying = useSharedValue(true);
  const flamePulse = useSharedValue(0);
  const backgroundOffset = useSharedValue(0);
  const viewHeight = useSharedValue(height);

  // Game constants as shared values for UI thread access
  const GRAVITY = (content.gravity ?? 0.5) * 0.04;
  const THRUST = (content.thrust ?? 10) / 5; // DB 10 = physics 2
  const WINNING_SCORE = content.winningScore ?? 10;

  const gravityValue = useSharedValue(GRAVITY);

  // Update gravity when content changes or score increases
  useEffect(() => {
    // Basic progression: Increase gravity by 5% for every point scored
    const difficultyMultiplier = 1 + score * 0.05;
    gravityValue.value = GRAVITY * difficultyMultiplier;
  }, [GRAVITY, score]);

  // Sync isPlaying with gameState
  useEffect(() => {
    isPlaying.value = gameState === "playing";

    if (gameState === "playing") {
      backgroundOffset.value = 0;
      backgroundOffset.value = withRepeat(
        // Fast constant loop for forward motion sensation
        withTiming(viewHeight.value, { duration: 1800, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(backgroundOffset);
    }

    return () => cancelAnimation(backgroundOffset);
  }, [gameState]);

  useEffect(() => {
    generateNewQuestion();
  }, [content, score]);

  const generateNewQuestion = () => {
    const min = content.operandRange?.[0] ?? 1;
    const max = content.operandRange?.[1] ?? 10;
    const allowedOperators = content.operators ?? ["+"];

    const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
    const operator =
      allowedOperators[Math.floor(Math.random() * allowedOperators.length)];

    let answer = 0;
    let qNum1 = num1;
    let qNum2 = num2;

    switch (operator) {
      case "+":
        answer = num1 + num2;
        break;
      case "-":
        answer = num1 - num2;
        break;
      case "*":
      case "x":
        answer = num1 * num2;
        break;
      case "/":
        answer = num1;
        qNum1 = answer * num2;
        break;
    }

    const choices = new Set<number>();
    choices.add(answer);
    while (choices.size < 3) {
      const offset = Math.floor(Math.random() * 5) + 1;
      const distractor =
        Math.random() > 0.5 ? answer + offset : answer - offset;
      if (distractor !== answer) choices.add(distractor);
    }

    setCurrentQuestion({
      num1: qNum1,
      num2: qNum2,
      operator: operator === "*" ? "×" : operator,
      answer,
      choices: Array.from(choices).sort(() => Math.random() - 0.5),
    });
  };

  // Callbacks for game over/win (must be called from UI thread via runOnJS)
  const handleGameOver = useCallback(() => {
    setGameState("game_over");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Avoid divide by zero if user crashes immediately
    const accuracy = totalAttempts > 0 ? score / totalAttempts : 0.0;
    onComplete(accuracy);
  }, [onComplete, score, totalAttempts]);

  // Physics loop running on UI thread
  useFrameCallback(() => {
    "worklet";
    if (!isPlaying.value) return;

    flamePulse.value += 0.2;
    if (flamePulse.value > Math.PI * 2) {
      flamePulse.value = 0;
    }

    // Apply gravity
    velocity.value += gravityValue.value;
    let newY = rocketY.value + velocity.value;

    // Off-screen collision - game over
    // Let it fall completely past the playable area (PLAYABLE_HEIGHT)
    if (newY > PLAYABLE_HEIGHT) {
      isPlaying.value = false;
      runOnJS(handleGameOver)();
      return;
    }

    // Ceiling collision - stop at top
    if (newY < 0) {
      newY = 0;
      velocity.value = 0;
    }

    rocketY.value = newY;
  });

  const handleAnswer = (choice: number) => {
    if (gameState !== "playing" || !currentQuestion) return;

    // Increment attempts for every answer
    const newTotalAttempts = totalAttempts + 1;
    setTotalAttempts(newTotalAttempts);

    if (choice === currentQuestion.answer) {
      velocity.value = -THRUST;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setScore((s) => {
        const newScore = s + 1;
        if (newScore >= WINNING_SCORE) {
          setGameState("won");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Calculate final accuracy
          const accuracy = newScore / newTotalAttempts;
          onComplete(accuracy);
        }
        return newScore;
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      velocity.value += 1.0;
    }
  };

  const rocketStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      velocity.value,
      [-8, 0, 8],
      [-3, 0, 3], // Very subtle tilt
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateY: rocketY.value } as const,
        { rotate: `${rotate}deg` } as const,
      ],
    };
  });

  const flameStyle = useAnimatedStyle(() => {
    const thrustIntensity = interpolate(
      velocity.value,
      [-THRUST * 1.2, 0],
      [1.0, 0.2],
      Extrapolation.CLAMP,
    );

    const flicker = 0.75 + 0.25 * Math.sin(flamePulse.value);

    return {
      position: "absolute",
      bottom: -6,
      opacity: Math.max(0.35, thrustIntensity) * flicker,
      transform: [{ scale: thrustIntensity * flicker }],
    };
  });
  const backgroundStyle1 = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: backgroundOffset.value }],
    };
  });

  const backgroundStyle2 = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: backgroundOffset.value - viewHeight.value }],
    };
  });

  if (!currentQuestion) return null;

  return (
    <View
      className="flex-1"
      onLayout={(e) => {
        viewHeight.value = e.nativeEvent.layout.height;
      }}
    >
      {/* Background Tiling */}
      <Animated.Image
        source={require("~/assets/images/games/math-rocket/background.png")}
        className="absolute inset-0 w-full h-full"
        style={backgroundStyle1}
        resizeMode="cover"
      />
      <Animated.Image
        source={require("~/assets/images/games/math-rocket/background.png")}
        className="absolute inset-0 w-full h-full"
        style={backgroundStyle2}
        resizeMode="cover"
      />

      {/* Rocket Play Area */}
      <View style={{ height: PLAYABLE_HEIGHT }} className="w-full">
        <Animated.View
          style={[
            rocketStyle,
            { position: "absolute", left: width / 2 - ROCKET_SIZE / 2 },
          ]}
          className="items-center"
        >
          <Image
            source={require("~/assets/images/games/math-rocket/rocket.png")}
            style={{ width: ROCKET_SIZE, height: ROCKET_SIZE }}
            contentFit="contain"
            cachePolicy="disk"
          />
          <Animated.Image
            source={require("~/assets/images/games/math-rocket/fire.png")}
            style={[
              { width: 48, height: 48, backgroundColor: "transparent" },
              flameStyle,
            ]}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Question & Answers */}
      <View className="flex-1 items-center justify-center px-6 gap-8">
        {/* Question */}
        <View className="flex-row items-center gap-3">
          <Text className="text-5xl font-black text-white">
            {currentQuestion.num1} {currentQuestion.operator}{" "}
            {currentQuestion.num2}
          </Text>
          <Text className="text-4xl font-bold text-white/70">=</Text>
          <Text className="text-5xl font-black text-primary">?</Text>
        </View>

        {/* Answer Buttons */}
        <View className="flex-row gap-4 w-full justify-center">
          {currentQuestion.choices.map((choice, idx) => (
            <Button
              key={`${score}-${idx}`}
              onPress={() => handleAnswer(choice)}
              className="flex-1 max-w-[120px] h-16 rounded-2xl"
              variant="default"
            >
              <Text className="text-2xl font-bold text-primary-foreground">
                {choice}
              </Text>
            </Button>
          ))}
        </View>
      </View>
    </View>
  );
}

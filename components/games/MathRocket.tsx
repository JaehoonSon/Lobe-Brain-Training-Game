import React, { useState, useEffect, useRef } from "react";
import { View, Image, Dimensions } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import * as Haptics from "expo-haptics";
import { MathRocketContent } from "~/lib/validators/game-content";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const ROCKET_SIZE = 100;
const PLAYABLE_HEIGHT = height * 0.55;

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
    "playing"
  );
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);

  const rocketY = useSharedValue(PLAYABLE_HEIGHT / 2);
  const velocity = useRef(0);

  // Game constants
  const GRAVITY = (content.gravity ?? 0.5) * 0.1;
  const THRUST = content.thrust ?? 15;
  const WINNING_SCORE = content.winningScore ?? 10;

  // Refs for loop access to ensure no stale closures
  const gravityRef = useRef(GRAVITY);
  gravityRef.current = GRAVITY;

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

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

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      // Only run physics if playing
      if (gameStateRef.current !== "playing") return;

      // Physics update using refs for current values
      velocity.current += gravityRef.current;
      let newY = rocketY.value + velocity.current;

      // Floor collision
      if (newY > PLAYABLE_HEIGHT - ROCKET_SIZE) {
        setGameState("game_over");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        onComplete(0.0);
        return;
      }

      // Ceiling collision
      if (newY < 0) {
        newY = 0;
        velocity.current = 0;
      }

      rocketY.value = newY;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleAnswer = (choice: number) => {
    if (gameState !== "playing" || !currentQuestion) return;

    if (choice === currentQuestion.answer) {
      velocity.current = -THRUST;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setScore((s) => {
        const newScore = s + 1;
        if (newScore >= WINNING_SCORE) {
          setGameState("won");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete(1.0);
        }
        return newScore;
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      velocity.current += 5;
    }
  };

  const rocketStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      velocity.current,
      [-20, 0, 20],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY: rocketY.value }, { rotate: `${rotation}deg` }],
    };
  });

  if (!currentQuestion) return null;

  return (
    <View className="flex-1">
      {/* Background */}
      <Image
        source={require("~/assets/images/games/math-rocket/background.png")}
        className="absolute inset-0 w-full h-full"
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

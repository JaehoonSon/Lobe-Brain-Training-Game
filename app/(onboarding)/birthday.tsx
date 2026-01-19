import { router } from "expo-router";
import {
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef } from "react";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { useOnboarding } from "~/contexts/OnboardingContext";

export default function BirthdaySelectionScreen({
  onNext,
  onBack,
}: CustomStepProps) {
  const insets = useSafeAreaInsets();
  const { updateData } = useOnboarding();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [focused, setFocused] = useState<"month" | "day" | "year" | null>(
    "month"
  );

  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const handleContinue = () => {
    // Save birthday to onboarding context if provided
    if (day && month && year.length === 4) {
      const birthday = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;
      updateData("birthday", birthday);
    }
    onNext();
  };

  const handleSkip = () => {
    // Clear any partial birthday data and proceed
    updateData("birthday", null);
    onNext();
  };

  // Auto-focus logic
  const handleMonthChange = (text: string) => {
    setMonth(text);
    if (text.length === 2) dayRef.current?.focus();
  };

  const handleDayChange = (text: string) => {
    setDay(text);
    if (text.length === 2) yearRef.current?.focus();
  };

  const handleYearChange = (text: string) => {
    setYear(text);
    if (text.length === 4) Keyboard.dismiss();
  };

  // Backspace logic
  const handleDayKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Backspace" && day === "") {
      monthRef.current?.focus();
    }
  };

  const handleYearKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Backspace" && year === "") {
      dayRef.current?.focus();
    }
  };

  const isValid = day.length > 0 && month.length > 0 && year.length === 4;

  const getInputStyle = (field: "month" | "day" | "year") => {
    const isFocused = focused === field;
    const hasValue = field === "month" ? month : field === "day" ? day : year;
    const borderColor = isFocused
      ? "border-primary"
      : hasValue
        ? "border-primary/50"
        : "border-slate-200";
    return `text-center text-4xl font-bold text-primary p-4 border-b-4 ${borderColor} ${field === "year" ? "w-32" : "w-24"
      }`;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        className="flex-1 bg-background px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-1 justify-center gap-8">
          <Animated.View entering={FadeInDown.duration(600)} className="gap-2">
            <Text className="text-4xl font-extrabold text-foreground text-center">
              When is your birthday?
            </Text>
            <Text className="text-xl text-muted-foreground text-center">
              We use this to personalize your experience.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="flex-row justify-center gap-4"
          >
            {/* Month */}
            <View className="items-center gap-2">
              <TextInput
                ref={monthRef}
                className={getInputStyle("month")}
                placeholder="MM"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                value={month}
                onChangeText={handleMonthChange}
                maxLength={2}
                autoFocus
                blurOnSubmit={false}
                onFocus={() => setFocused("month")}
                onBlur={() => setFocused(null)}
              />
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${focused === "month" ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                Month
              </Text>
            </View>

            {/* Day */}
            <View className="items-center gap-2">
              <TextInput
                ref={dayRef}
                className={getInputStyle("day")}
                placeholder="DD"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                value={day}
                onChangeText={handleDayChange}
                onKeyPress={handleDayKeyPress}
                maxLength={2}
                blurOnSubmit={false}
                onFocus={() => setFocused("day")}
                onBlur={() => setFocused(null)}
              />
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${focused === "day" ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                Day
              </Text>
            </View>

            {/* Year */}
            <View className="items-center gap-2">
              <TextInput
                ref={yearRef}
                className={getInputStyle("year")}
                placeholder="YYYY"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                value={year}
                onChangeText={handleYearChange}
                onKeyPress={handleYearKeyPress}
                maxLength={4}
                onFocus={() => setFocused("year")}
                onBlur={() => setFocused(null)}
              />
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${focused === "year" ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                Year
              </Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} className="gap-3">
          <Button
            className="w-full rounded-2xl h-12 native:h-16 px-10"
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text className="font-bold text-xl text-primary-foreground">Continue</Text>
          </Button>
          <Button
            variant="link"
            className="w-full"
            onPress={handleSkip}
          >
            <Text className="font-semibold text-base tracking-wide text-muted-foreground">Skip for now</Text>
          </Button>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

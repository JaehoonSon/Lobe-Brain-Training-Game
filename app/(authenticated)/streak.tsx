import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Flame, Trophy, Target, X } from "lucide-react-native";
import { router } from "expo-router";
import { H1, P, Muted } from "~/components/ui/typography";
import { Card, CardContent } from "~/components/ui/card";
import Svg, { Circle } from "react-native-svg";
import { supabase } from "~/lib/supabase";
import { useAuth } from "~/contexts/AuthProvider";
import { Database } from "~/lib/database.types";
import LottieView from "lottie-react-native";

type UserStreak = Database["public"]["Tables"]["user_streaks"]["Row"];

// Milestone thresholds (in days)
const MILESTONES = [7, 14, 30, 60, 90, 180, 365, 500, 1000];

/**
 * Calculate the next milestone based on current streak
 */
function getNextMilestone(currentStreak: number): number {
  for (const milestone of MILESTONES) {
    if (currentStreak < milestone) {
      return milestone;
    }
  }
  // If beyond all milestones, next is current + 365 (yearly)
  return Math.ceil(currentStreak / 365) * 365 + 365;
}

/**
 * Get days of the week that have been completed based on last_played_date and current streak
 */
function getCompletedDaysThisWeek(
  lastPlayedDate: string | null,
  currentStreak: number
): number[] {
  if (!lastPlayedDate || currentStreak <= 0) return [];

  const today = new Date(); // Local now
  const lastPlayed = new Date(lastPlayedDate); // Auto-converts UTC ISO to Local time

  // Calculate start of week (Sunday) at 00:00:00 Local Time
  const todayDay = today.getDay(); // 0-6
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - todayDay);
  startOfWeek.setHours(0, 0, 0, 0);

  // Check if last played is within this week
  if (lastPlayed.getTime() < startOfWeek.getTime()) {
    return [];
  }

  const lastPlayedDay = lastPlayed.getDay();
  const completedDays: number[] = [];

  // Mark consecutive days going back from lastPlayedDay based on streak length
  // but only for days within this week (day index >= 0)
  for (let i = 0; i < currentStreak; i++) {
    const dayIndex = lastPlayedDay - i;
    if (dayIndex >= 0) {
      completedDays.push(dayIndex);
    } else {
      // Day falls into previous week, stop adding
      break;
    }
  }

  return completedDays;
}

export default function StreakScreen() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const days = ["S", "M", "T", "W", "T", "F", "S"];

  useEffect(() => {
    const fetchStreakData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching streak data:", error);
          return;
        }

        setStreakData(data);
      } catch (err) {
        console.error("Failed to fetch streak data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreakData();
  }, [user]);

  const currentStreak = streakData?.current_streak ?? 0;
  const bestStreak = streakData?.best_streak ?? 0;
  const nextMilestone = getNextMilestone(currentStreak);
  const daysToMilestone = nextMilestone - currentStreak;
  const completedDays = getCompletedDaysThisWeek(
    streakData?.last_played_date ?? null,
    currentStreak
  );

  // Progress ring calculations
  const size = 160;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = nextMilestone > 0 ? currentStreak / nextMilestone : 0;
  const strokeDashoffset = circumference * (1 - progress);

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-background items-center justify-center"
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header with Back Button */}
      <View className="relative flex-row items-center px-4 py-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-muted items-center justify-center"
        >
          <X size={24} className="text-foreground" />
        </TouchableOpacity>

        {/* Centered title */}
        <View className="absolute left-0 right-0 items-center">
          <H1 className="text-3xl font-black">Training Streak</H1>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6">
          {/* Main Fire Animation */}
          <Animated.View
            entering={ZoomIn.duration(600).springify()}
            className="items-center mt-4 mb-4"
          >
            <LottieView
              source={require("~/assets/animations/fire.lottie.json")}
              autoPlay
              loop
              style={{ width: 160, height: 160 }}
              speed={0.9}
            />
          </Animated.View>

          {/* Weekly Days Row */}
          <SectionHeader>This Week</SectionHeader>
          <Card className="mb-2 overflow-hidden border-border/50 bg-card">
            <CardContent className="p-4">
              <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
                className="flex-row justify-between"
              >
                {days.map((day, index) => {
                  const todayIndex = new Date().getDay();
                  const isToday = index === todayIndex;
                  const isPast = index < todayIndex;
                  const isCompleted = completedDays.includes(index);

                  return (
                    <View key={index} className="items-center gap-1.5">
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center ${isCompleted
                            ? "bg-orange-500/20"
                            : isPast
                              ? "bg-destructive/10"
                              : "bg-muted"
                          }`}
                      >
                        {isCompleted ? (
                          <Flame size={18} color="#F97316" fill="#F97316" />
                        ) : isPast ? (
                          <X size={16} className="text-destructive" />
                        ) : null}
                      </View>
                      <P
                        className={`text-xs ${isToday
                            ? "font-black text-foreground"
                            : isCompleted
                              ? "font-bold text-foreground"
                              : "font-medium text-muted-foreground"
                          }`}
                      >
                        {day}
                      </P>
                    </View>
                  );
                })}
              </Animated.View>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <SectionHeader>Your Stats</SectionHeader>
          <Card className="mb-2 overflow-hidden border-border/50 bg-card">
            <CardContent className="p-0">
              <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                {/* Current Streak */}
                <View className="flex-row items-center px-4 py-3.5">
                  <View className="w-9 h-9 rounded-lg items-center justify-center mr-3 bg-orange-500/20">
                    <Flame size={20} color="#F97316" fill="#F97316" />
                  </View>
                  <View className="flex-1">
                    <Muted className="text-xs font-bold">Current Streak</Muted>
                    <P className="text-2xl font-black text-foreground">
                      {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                    </P>
                  </View>
                </View>

                <View className="h-px bg-border/50 ml-14" />

                {/* Best Streak */}
                <View className="flex-row items-center px-4 py-3.5">
                  <View className="w-9 h-9 rounded-lg items-center justify-center mr-3 bg-yellow-500/20">
                    <Trophy size={20} color="#EAB308" />
                  </View>
                  <View className="flex-1">
                    <Muted className="text-xs font-bold">Best Streak</Muted>
                    <P className="text-2xl font-black text-foreground">
                      {bestStreak} day{bestStreak !== 1 ? "s" : ""}
                    </P>
                  </View>
                </View>
              </Animated.View>
            </CardContent>
          </Card>

          {/* Milestone Section */}
          <SectionHeader>Next Milestone</SectionHeader>
          <Card className="overflow-hidden border-border/50 bg-card">
            <CardContent className="p-4">
              <Animated.View entering={FadeInDown.delay(600).duration(600)}>
                {/* Progress Bar Container */}
                <View className="relative h-14 justify-center">
                  {/* Background Bar - spans full width behind icons */}
                  <View
                    className="absolute left-7 right-7 h-3.5 bg-muted rounded-full"
                    style={{ top: "50%", marginTop: -7 }}
                  />
                  {/* Progress Fill */}
                  <View
                    className="absolute left-7 h-3.5 bg-orange-500 rounded-l-full"
                    style={{
                      top: "50%",
                      marginTop: -7,
                      width: `${Math.min(progress * 100, 100) * 0.82}%`,
                    }}
                  />

                  {/* Icons Row */}
                  <View className="flex-row items-center justify-between">
                    {/* Current Streak Icon */}
                    <View className="w-14 h-14 rounded-full border-[3px] border-orange-500 items-center justify-center bg-card">
                      <Flame size={26} color="#F97316" fill="#F97316" />
                    </View>

                    {/* Next Milestone Icon */}
                    <View className="w-14 h-14 rounded-full border-[3px] border-muted items-center justify-center bg-card">
                      <Target size={26} className="text-muted-foreground" />
                    </View>
                  </View>
                </View>

                {/* Labels Row - tight under the circles */}
                <View className="flex-row justify-between px-3">
                  <P className="text-foreground text-lg font-black">
                    {currentStreak}
                  </P>
                  <P className="text-muted-foreground text-lg font-black">
                    {nextMilestone}
                  </P>
                </View>

                {/* Upcoming Reward Text */}
                <View className="items-center mt-2">
                  <Muted className="text-xs uppercase tracking-wider">
                    Upcoming Reward:
                  </Muted>
                  <P className="text-foreground font-bold text-sm">
                    {nextMilestone} Day Badge
                  </P>
                </View>
              </Animated.View>
            </CardContent>
          </Card>

          {/* Why Streaks Matter Section */}
          <SectionHeader>Why Streaks Matter</SectionHeader>
          <Card className="overflow-hidden border-border/50 bg-card">
            <CardContent className="p-4">
              <Animated.View entering={FadeInDown.delay(800).duration(600)}>
                <P className="text-foreground leading-6 mb-3">
                  Consistent brain training strengthens neural pathways through
                  a process called{" "}
                  <P className="font-bold text-primary">neuroplasticity</P>:
                  your brain's ability to rewire itself.
                </P>
                <P className="text-muted-foreground leading-6 mb-3">
                  Just like physical exercise, daily mental workouts build
                  cognitive "muscle memory." Research shows that regular
                  practice improves:
                </P>
                <View className="gap-2 ml-2">
                  <View className="flex-row items-start gap-2">
                    <P className="text-primary">•</P>
                    <P className="text-muted-foreground flex-1">
                      Working memory and focus
                    </P>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <P className="text-primary">•</P>
                    <P className="text-muted-foreground flex-1">
                      Processing speed and reaction time
                    </P>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <P className="text-primary">•</P>
                    <P className="text-muted-foreground flex-1">
                      Problem-solving and mental flexibility
                    </P>
                  </View>
                </View>
                <P className="text-muted-foreground leading-6 mt-3">
                  Keep your streak alive to maximize these benefits! 🧠
                </P>
              </Animated.View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Components (matching settings.tsx style)
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <P className="text-muted-foreground text-sm font-black uppercase tracking-wider mb-2 ml-1 mt-5">
      {children}
    </P>
  );
}

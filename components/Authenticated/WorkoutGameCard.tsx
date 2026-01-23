import { View, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { H4, P } from "~/components/ui/typography";
import { Card } from "~/components/ui/card";
import { Check, Lock, Play } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Database } from "~/lib/database.types";
import { cn } from "~/lib/utils";

type Game = Database["public"]["Tables"]["games"]["Row"];

interface WorkoutGameCardProps {
  game: Game;
  status: "locked" | "active" | "completed";
  index: number;
  isLast: boolean;
  onPress: () => void;
}

export function WorkoutGameCard({
  game,
  status,
  index,
  isLast,
  onPress,
}: WorkoutGameCardProps) {
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isLocked = status === "locked";

  // Mock icons based on category (replace with real icons later)
  // You might want to pass a category lookup or store icons in the game object

  return (
    <View className="flex-row items-center mb-4">
      {/* Timeline Indicator */}
      <View className="items-center mr-4" style={{ width: 24 }}>
        {/* Line */}
        {!isLast && (
          <View
            className={cn(
              "absolute top-6 bottom-[-24px] w-[2px]",
              isCompleted ? "bg-primary" : "bg-muted-foreground/20"
            )}
          />
        )}

        {/* Node */}
        <View
          className={cn(
            "w-6 h-6 rounded-full border-2 items-center justify-center bg-background z-10",
            isCompleted
              ? "border-primary bg-primary"
              : isActive
                ? "border-primary"
                : "border-muted-foreground/30"
          )}
        >
          {isCompleted && <Check size={14} color="white" strokeWidth={3} />}
          {isActive && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
        </View>
      </View>

      {/* Card */}
      <TouchableOpacity
        activeOpacity={isActive ? 0.7 : 1}
        onPress={isActive || isCompleted ? onPress : undefined}
        className="flex-1"
        disabled={isLocked}
      >
        <Card
          variant={isActive ? "primary" : "default"}
          className={cn(
            "flex-row items-center p-4",
            isLocked && "opacity-60 bg-muted/20"
          )}
        >
          {/* Game Icon Placeholder */}
          <View
            className={cn(
              "w-14 h-14 rounded-xl items-center justify-center mr-4 overflow-hidden",
              isActive ? "bg-white/20" : "bg-muted/20"
            )}
          >
            {game.icon_url ? (
              <Image
                source={{ uri: game.icon_url }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="disk"
                transition={200}
              />
            ) : (
              <Play
                size={24}
                className={isActive ? "text-primary-foreground" : "text-foreground"}
                fill={isActive ? "currentColor" : "none"}
              />
            )}
          </View>

          <View className="flex-1">
            <H4
              className={cn(
                "text-lg font-black mb-1",
                isActive ? "text-primary-foreground" : "text-foreground",
                isCompleted && "text-muted-foreground line-through"
              )}
            >
              {game.name}
            </H4>
            <P
              className={cn(
                "text-sm font-bold",
                isActive
                  ? "text-primary-foreground/90"
                  : "text-muted-foreground"
              )}
            >
              {game.instructions ? t('workout_card.daily') : t('workout_card.focus')} • {t('workout_card.duration')}
            </P>
          </View>

          {/* Action indicator */}
          {isActive && (
            <View className="bg-white/20 p-2 rounded-full">
              <Play
                size={16}
                className="text-primary-foreground"
                fill="currentColor"
              />
            </View>
          )}
          {isLocked && <Lock size={16} className="text-muted-foreground" />}
        </Card>
      </TouchableOpacity>
    </View>
  );
}

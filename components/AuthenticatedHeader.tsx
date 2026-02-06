import { TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Code2, Flame, Settings, Zap } from "lucide-react-native";
import { P } from "~/components/ui/typography";
import { useUserStats } from "~/contexts/UserStatsContext";
import { cn } from "~/lib/utils";

interface AuthenticatedHeaderProps {
  className?: string;
}

export function AuthenticatedHeader({ className }: AuthenticatedHeaderProps) {
  const { currentStreak, overallBPI } = useUserStats();

  return (
    <View className={cn("flex-row justify-between items-center", className)}>
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-row items-center bg-card rounded-xl px-3 py-1.5 border-2 border-border border-b-4 active:border-b-2 active:translate-y-0.5"
          onPress={() => router.push("/streak")}
        >
          <Flame size={18} className="text-orange-500 mr-1.5" fill="#f97316" />
          <P className="font-bold text-sm tracking-tight">{currentStreak}</P>
        </TouchableOpacity>
        <View className="flex-row items-center bg-card rounded-xl px-3 py-1.5 border-2 border-border border-b-4">
          <Zap size={18} className="text-yellow-500 mr-1.5" fill="#eab308" />
          <P className="font-bold text-sm tracking-tight">
            {overallBPI !== null ? overallBPI : "--"}
          </P>
        </View>
      </View>
      <View className="flex-row gap-4 items-center">
        {__DEV__ && (
          <TouchableOpacity onPress={() => router.push("/dev_setting")}>
            <Code2 size={26} className="text-foreground" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Settings size={26} className="text-foreground" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

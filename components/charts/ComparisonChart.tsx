import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import Svg, { Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { Text } from "~/components/ui/text";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ComparisonChartProps {
  percentile: number; // 0-100
}

export function ComparisonChart({ percentile }: ComparisonChartProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const size = 140;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const displayPercentile = Math.max(0, Math.min(100, percentile ?? 0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: displayPercentile,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [displayPercentile]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <>
      <View className="flex-row items-center justify-center py-4 px-2">
        {/* Legend Left */}
        <View className="items-center gap-0.5 flex-1">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            <Text className="text-2xl font-black text-foreground">
              {displayPercentile}%
            </Text>
          </View>
          <Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
            You
          </Text>
        </View>

        {/* Chart Center */}
        <View
          style={{ width: size, height: size }}
          className="items-center justify-center"
        >
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <LinearGradient id="userGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#f97316" stopOpacity="1" />
                <Stop offset="1" stopColor="#ea580c" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {/* Background Track - Full Circle (Other Players) */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#d1d5db"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* User Progress Arc */}
            <G rotation="-90" origin={`${center}, ${center}`}>
              <AnimatedCircle
                cx={center}
                cy={center}
                r={radius}
                stroke="url(#userGrad)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </G>
          </Svg>
        </View>

        {/* Legend Right */}
        <View className="items-center gap-0.5 flex-1">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <Text className="text-2xl font-black text-muted-foreground">
              {100 - displayPercentile}%
            </Text>
          </View>
          <Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider text-center">
            Others
          </Text>
        </View>
      </View>

      {/* Explanation */}
      <Text className="text-center text-muted-foreground text-sm px-4 pb-2">
        You're performing better than {displayPercentile}% of all players.
      </Text>
    </>
  );
}

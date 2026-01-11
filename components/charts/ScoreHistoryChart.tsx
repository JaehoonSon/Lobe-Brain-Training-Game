import React from "react";
import {
  View,
  Text,
  useColorScheme,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { cn } from "~/lib/utils";

export type ChartRange = "90D" | "6M" | "1Y" | "ALL";

interface ScoreHistoryChartProps {
  data: { value: number; label?: string; date?: string }[];
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  height?: number;
  loading?: boolean;
}

export function ScoreHistoryChart({
  data,
  range,
  onRangeChange,
  height = 220,
}: ScoreHistoryChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Colors
  const lineColor = isDark ? "#ffffff" : "#fa8b4b"; // Primary orange / white
  const textColor = isDark ? "#9ca3af" : "#6b7280"; // gray-400 / gray-500
  const gridColor = isDark ? "#374151" : "#e5e7eb"; // gray-700 / gray-200

  // Calculate width
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 64; // Account for card padding

  // Fallback for empty data to show grid
  const hasData = data && data.length > 0;
  const displayData = hasData ? data : [{ value: 0 }, { value: 100 }]; // Dummy for grid

  // Prepare chart data
  const chartData = displayData.map((item) => ({
    ...item,
    labelTextStyle: { color: textColor, fontSize: 10 },
    dataPointText: undefined, // Ensure no floating text
  }));

  const Ranges: ChartRange[] = ["90D", "6M", "1Y", "ALL"];

  return (
    <View className="w-full">
      <View style={{ height: height + 20 }}>
        {/* Empty State Overlay */}
        {!hasData && (
          <View className="absolute inset-0 z-10 items-center justify-center">
            <Text className="text-muted-foreground font-medium">
              No data for this period
            </Text>
          </View>
        )}

        <LineChart
          data={chartData}
          height={height}
          width={chartWidth}
          // Line Style
          curved
          curveType={1}
          color={hasData ? lineColor : "transparent"}
          thickness={3}
          // Area (Subtle gradient or none based on preference, screenshots show none/minimal)
          areaChart={false}
          // Data Points
          hideDataPoints={false}
          dataPointsColor={hasData ? lineColor : "transparent"}
          dataPointsRadius={3}
          // Axes
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: textColor, fontSize: 11 }}
          xAxisColor="transparent"
          yAxisColor="transparent"
          // Grid
          hideRules={false}
          rulesType="dashed"
          rulesColor={gridColor}
          dashWidth={4}
          dashGap={4}
          noOfSections={4}
          maxValue={800} // Keep consistency
          // Spacing
          spacing={hasData ? Math.max(40, chartWidth / data.length) : 40}
          initialSpacing={20}
          endSpacing={20}
          // Animation
          isAnimated
          animationDuration={600}
          // Tooltip (Pointer)
          pointerConfig={{
            pointerStripHeight: height,
            pointerStripColor: gridColor,
            pointerStripWidth: 1,
            pointerColor: lineColor,
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 90,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              const item = items[0];
              return (
                <View
                  style={{
                    backgroundColor: "#1f2937", // Always dark for tooltip
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: -30,
                    marginLeft: -40,
                  }}
                >
                  <Text className="text-white font-bold text-base">
                    {item.value}
                  </Text>
                  {item.label && (
                    <Text className="text-gray-300 text-[10px]">
                      {item.label}
                    </Text>
                  )}
                </View>
              );
            },
          }}
        />
      </View>
      <RangeTabs range={range} onChange={onRangeChange} />
    </View>
  );
}

interface RangeTabsProps {
  range: ChartRange;
  onChange: (range: ChartRange) => void;
}

export function RangeTabs({ range, onChange }: RangeTabsProps) {
  const Ranges: ChartRange[] = ["90D", "6M", "1Y", "ALL"];

  return (
    <View className="flex-row bg-muted/30 p-1 rounded-2xl mt-4 mx-4">
      {Ranges.map((r) => {
        const isActive = range === r;
        return (
          <TouchableOpacity
            key={r}
            onPress={() => onChange(r)}
            className={cn(
              "flex-1 py-1.5 items-center justify-center rounded-xl",
              isActive ? "bg-background shadow-sm" : ""
            )}
          >
            <Text
              className={cn(
                "text-xs font-bold",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {r}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

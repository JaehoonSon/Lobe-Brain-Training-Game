import React, { useState } from "react";
import { View, TouchableOpacity, useWindowDimensions } from "react-native";
import { format } from "date-fns";
import { LineChart } from "react-native-gifted-charts";
import { Text } from "~/components/ui/text";
import { P } from "~/components/ui/typography";
import { ScoreHistoryPoint } from "~/contexts/UserStatsContext";
import { cn } from "~/lib/utils";

export type ChartRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

interface ScoreHistoryChartProps {
  history: ScoreHistoryPoint[];
  lineColor?: string;
}

export function ScoreHistoryChart({
  history,
  lineColor = "#d925b5",
}: ScoreHistoryChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  // Use measured container width, fallback to screen-based calculation
  const chartWidth = containerWidth ? containerWidth - 60 : screenWidth - 160;
  const [range, setRange] = useState<ChartRange>("3M");

  if (history.length === 0) {
    return <P className="text-center py-8">No history yet</P>;
  }

  // If container width hasn't been measured yet, render a placeholder to get its dimensions
  if (containerWidth === null) {
    return (
      <View
        style={{ height: 280, width: "100%" }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      />
    );
  }

  // Filter by range
  const now = new Date();
  let cutoffDate: Date | null = null;

  if (range === "1W") {
    cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (range === "1M") {
    cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  } else if (range === "3M") {
    cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - 90);
  } else if (range === "6M") {
    cutoffDate = new Date(now);
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);
  } else if (range === "1Y") {
    cutoffDate = new Date(now);
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
  }

  const filteredHistory = cutoffDate
    ? history.filter((h) => new Date(h.date) >= cutoffDate!)
    : history;

  // Sort by date to ensure chronological order
  const sortedHistory = [...filteredHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Calculate "nice interval" labeling - like Y-axis, show clean grid markers only
  // Don't force first/last labels, just show points on the step grid
  const labelIndices = new Set<number>();
  if (sortedHistory.length > 1) {
    const startDate = new Date(sortedHistory[0].date);
    const endDate = new Date(sortedHistory[sortedHistory.length - 1].date);
    const rangeDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Choose step: aim for ~4-5 labels
    let stepDays = 2;
    if (rangeDays <= 10) stepDays = 2;
    else if (rangeDays <= 30) stepDays = Math.ceil(rangeDays / 5);
    else if (rangeDays <= 90) stepDays = 14;
    else if (rangeDays <= 180) stepDays = 30;
    else stepDays = 60;

    // Find data points that fall on the step grid (multiples of stepDays from start)
    const startTime = startDate.getTime();
    for (let i = 0; i < sortedHistory.length; i++) {
      const pointDate = new Date(sortedHistory[i].date);
      const daysSinceStart = Math.round(
        (pointDate.getTime() - startTime) / (1000 * 60 * 60 * 24),
      );

      // Label if this day is a multiple of stepDays
      if (daysSinceStart % stepDays === 0) {
        labelIndices.add(i);
      }
    }
  } else if (sortedHistory.length === 1) {
    labelIndices.add(0);
  }

  // Transform data
  const chartData = sortedHistory.map((point, index) => {
    // Show label if it's in our pre-calculated set
    const showLabel = labelIndices.has(index);

    return {
      value: point.score,
      label: showLabel ? format(new Date(point.date), "MMM d") : "",
      labelTextStyle: {
        color: "#6b7280",
        fontSize: 10,
        width: 40,
        marginLeft: 0,
      },
      dataPointLabelComponent: () => null,
    };
  });

  const maxScore = Math.max(...chartData.map((d) => d.value), 100);

  // Round maxValue to nice intervals (multiples of 200)
  const roundedMax = Math.ceil(maxScore / 200) * 200;

  // Format Y-axis labels
  const formatY = (val: string) => {
    const num = Number(val);
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(Math.round(num));
  };

  const Ranges: ChartRange[] = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

  return (
    <View>
      <View
        style={{
          height: 280,
          width: "100%",
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 16)}
      >
        <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          curved
          color={lineColor}
          thickness={2}
          hideDataPoints={chartData.length > 20}
          dataPointsColor={lineColor}
          dataPointsRadius={4}
          yAxisThickness={2}
          yAxisColor="#e5e7eb"
          yAxisTextStyle={{ color: "#6b7280", fontSize: 10 }}
          yAxisLabelWidth={30}
          formatYLabel={formatY}
          noOfSections={3}
          xAxisThickness={2}
          xAxisColor="#e5e7eb"
          xAxisLabelTextStyle={{ color: "#6b7280", fontSize: 10, marginTop: 4 }}
          hideRules={false}
          rulesType="dashed"
          rulesColor="#f3f4f6"
          maxValue={roundedMax}
          yAxisOffset={0}
          adjustToWidth={true}
          isAnimated
        />
      </View>

      {/* Range Selector */}
      <View className="flex-row bg-muted/30 p-1.5 rounded-2xl mx-4">
        {Ranges.map((r) => {
          const isActive = range === r;
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              className={cn(
                "flex-1 py-2.5 items-center justify-center rounded-xl",
                isActive ? "bg-primary shadow-sm" : "",
              )}
            >
              <Text
                className={cn(
                  "text-sm font-bold",
                  isActive ? "text-white" : "text-muted-foreground",
                )}
              >
                {r}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

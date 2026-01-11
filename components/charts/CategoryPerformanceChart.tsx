import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { ScoreHistoryChart, ChartRange } from "./ScoreHistoryChart";
import { ScoreHistoryPoint } from "~/contexts/UserStatsContext";
import {
  format,
  parseISO,
  subDays,
  subMonths,
  subYears,
  isAfter,
  startOfDay,
} from "date-fns";

interface CategoryPerformanceChartProps {
  history: ScoreHistoryPoint[];
}

export function CategoryPerformanceChart({
  history,
}: CategoryPerformanceChartProps) {
  const [range, setRange] = useState<ChartRange>("90D");

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    // Filter by Range
    const now = startOfDay(new Date());
    let cutoffDate: Date | null = null;

    if (range === "90D") cutoffDate = subDays(now, 90);
    else if (range === "6M") cutoffDate = subMonths(now, 6);
    else if (range === "1Y") cutoffDate = subYears(now, 1);

    const filteredHistory = cutoffDate
      ? history.filter((h) => isAfter(parseISO(h.date), cutoffDate!))
      : history;

    return filteredHistory.map((point) => ({
      value: point.score,
      label: format(parseISO(point.date), "MM/dd"),
      date: point.date,
    }));
  }, [history, range]);

  return (
    <View>
      <ScoreHistoryChart
        data={chartData}
        range={range}
        onRangeChange={setRange}
      />
    </View>
  );
}

import { startOfWeek, addDays, addWeeks, format } from "date-fns";

export function getWeekDates(weeksOffset = 0) {
  const today = new Date();
  const targetDate = addWeeks(today, weeksOffset);
  const monday = startOfWeek(targetDate, { weekStartsOn: 1 }); // 1 = Monday

  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

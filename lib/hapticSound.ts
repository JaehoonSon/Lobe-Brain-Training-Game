import * as Haptics from "expo-haptics";

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "rigid"
  | "soft"
  | "success"
  | "warning"
  | "error"
  | "selection";

export const playHaptic = async (type: HapticType): Promise<void> => {
  switch (type) {
    case "light":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case "medium":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case "heavy":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    case "rigid":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    case "soft":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    case "success":
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    case "warning":
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
    case "error":
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    case "selection":
      return Haptics.selectionAsync();
    default:
      // TypeScript will ensure this never happens
      const _exhaustive: never = type;
      throw new Error(`Unknown haptic type: ${_exhaustive}`);
  }
};

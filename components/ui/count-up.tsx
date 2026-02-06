import React, { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { Text as RNText } from "./text";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                   */
/* ------------------------------------------------------------------ */

export type CountUpProps = ComponentProps<typeof RNText> & {
  /** The starting number */
  from: number;
  /** The ending number */
  to: number;
  /** Duration of the entire animation in milliseconds (default = 2000) */
  duration?: number;
  /** Number of decimal places to show (default = 0) */
  decimals?: number;
  /** Enable haptic feedback for each step (default = true) */
  haptic?: boolean;
  /** Customize the haptic style (default = Impact.Light) */
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  /** Custom formatting function for the number */
  formatter?: (value: number) => string;
  /** Callback when counting animation ends */
  onCountEnd?: () => void;
  /** Delay the animation start in milliseconds (default = 0) */
};

/** Stable no-op prevents effect restarts */
const noop = () => {};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function CountUp({
  from,
  to,
  duration = 2000,
  decimals = 0,
  className,
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  formatter,
  onCountEnd = noop,
  ...rest
}: CountUpProps) {
  const [currentValue, setCurrentValue] = useState<number>(from);

  useEffect(() => {
    setCurrentValue(from); // reset at start
    const startTime = Date.now();
    const difference = to - from;

    /* 60 fps interval ------------------------------------------------------ */
    const stepMs = 1000 / 60; // ≈16.67 ms
    const id = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out-quint: very quick start, gentle finish
      const eased = 1 - Math.pow(1 - progress, 5);
      setCurrentValue(from + difference * eased);

      /* occasional haptic pulse ------------------------------------------ */
      if (haptic && Math.random() < 0.1) {
        Haptics.impactAsync(hapticStyle).catch(() => {});
      }

      /* end condition ----------------------------------------------------- */
      if (progress >= 1) {
        clearInterval(id);
        setCurrentValue(to); // snap to exact final value
        onCountEnd();
      }
    }, stepMs);

    return () => clearInterval(id); // cleanup
  }, [from, to, duration, haptic, hapticStyle, onCountEnd]); // deps stable

  /* ------------------------------------------------------------------ */
  /*  Formatting                                                        */
  /* ------------------------------------------------------------------ */

  const formatValue = (value: number): string => {
    if (formatter) return formatter(value);

    const factor = 10 ** decimals;
    const rounded = Math.round(value * factor) / factor;
    return decimals
      ? rounded.toFixed(decimals)
      : Math.round(rounded).toString();
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <RNText className={className} {...rest}>
        {formatValue(currentValue)}
      </RNText>
    </Animated.View>
  );
}

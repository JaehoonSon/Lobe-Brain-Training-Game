import React, { useEffect, useState } from "react";
import type { ComponentProps } from "react";
// import { Text as RNText } from "react-native";
import { Text as RNText } from "./text";
import * as Haptics from "expo-haptics";

export type TypeWriterProps = ComponentProps<typeof RNText> & {
  /** The full string to type out */
  text: string;
  /** Milliseconds per character (default 100) */
  speed?: number;
  /** Enable haptic feedback for each typed character (default true) */
  haptic?: boolean;
  /** Customize the haptic style (default Impact.Light) */
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  onTypingEnd?: () => void;
};

export function TypeWriter({
  text,
  speed = 100,
  className,
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  onTypingEnd = () => {},
  ...rest
}: TypeWriterProps) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");

    let i = 0;
    const id = setInterval(() => {
      setDisplayed((prev) => {
        const nextIndex = prev.length;

        // when we reach the end, stop the timer
        if (nextIndex >= text.length) {
          clearInterval(id);
          return prev;
        }

        // append the next character
        const next = prev + text[nextIndex];

        // fire haptic feedback (best effort)
        if (haptic) {
          Haptics.impactAsync(hapticStyle).catch(() => {});
        }
        i += 1;
        if (i === text.length) {
          setTimeout(() => onTypingEnd(), 0); // ⬅️  fire the callback *here*
        }

        return next;
      });
    }, speed);

    // cleanup on unmount / prop change
    return () => clearInterval(id);
  }, [text, speed, haptic, hapticStyle]);

  return (
    <RNText className={className} {...rest}>
      {displayed}
    </RNText>
  );
}

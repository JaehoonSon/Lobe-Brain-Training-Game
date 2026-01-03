import React from "react";
import { Text, TextProps, TextStyle } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

interface GradientTextProps extends TextProps {
  text: string;
  colors?: string[];
  fontSize?: number;
  style?: TextStyle;
}

export default function GradientText({
  text,
  colors = ["#FF0080", "#7928CA"],
  fontSize = 24,
  style,
  ...props
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { fontSize, fontWeight: "bold" }]} {...props}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text
          style={[style, { fontSize, fontWeight: "bold", opacity: 0 }]}
          {...props}
        >
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

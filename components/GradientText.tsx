import React from "react";
import { Text as RNText, TextProps, TextStyle, View } from "react-native";
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
        <RNText
          style={[
            style,
            { fontSize, fontWeight: "bold", paddingVertical: 4, paddingHorizontal: 4 },
          ]}
          {...props}
        >
          {text}
        </RNText>
      }
    >
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Render invisible text to give the gradient its shape/size */}
        <RNText
          style={[
            style,
            {
              fontSize,
              fontWeight: "bold",
              opacity: 0,
              paddingVertical: 4,
              paddingHorizontal: 4,
            },
          ]}
          {...props}
        >
          {text}
        </RNText>
      </LinearGradient>
    </MaskedView>
  );
}

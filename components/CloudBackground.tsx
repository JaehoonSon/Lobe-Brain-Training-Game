import React from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { cn } from "~/lib/utils";

interface CloudBackgroundProps {
    children?: React.ReactNode;
    className?: string;
    skyColor?: string;
}

export function CloudBackground({
    children,
    className,
    skyColor = "#e0f2fe", // Default sky-100
}: CloudBackgroundProps) {
    const { width } = useWindowDimensions();
    const height = width * 1.05; // Increased height
    const cloudHeight = width * 1.05;

    // A more pronounced "cloud" path
    const cloudPath = `
    M0,0 
    L${width},0 
    L${width},${cloudHeight * 0.82} 
    C${width * 0.9},${cloudHeight * 0.82} ${width * 0.85},${cloudHeight * 0.88} ${width * 0.78},${cloudHeight * 0.88}
    C${width * 0.72},${cloudHeight * 0.88} ${width * 0.7},${cloudHeight * 0.82} ${width * 0.65},${cloudHeight * 0.82}
    C${width * 0.58},${cloudHeight * 0.82} ${width * 0.52},${cloudHeight * 0.94} ${width * 0.45},${cloudHeight * 0.94}
    C${width * 0.38},${cloudHeight * 0.94} ${width * 0.35},${cloudHeight * 0.85} ${width * 0.3},${cloudHeight * 0.85}
    C${width * 0.25},${cloudHeight * 0.85} ${width * 0.2},${cloudHeight * 0.92} ${width * 0.12},${cloudHeight * 0.92}
    C${width * 0.05},${cloudHeight * 0.92} ${width * 0.02},${cloudHeight * 0.82} 0,${cloudHeight * 0.82}
    Z
  `;

    return (
        <View className={cn("absolute top-0 left-0 right-0", className)} style={{ height }}>
            <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
                <Defs>
                    <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={skyColor} stopOpacity="1" />
                        <Stop offset="0.8" stopColor={skyColor} stopOpacity="0.9" />
                        <Stop offset="1" stopColor={skyColor} stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                {/* Sky Background with Clouds */}
                <Path d={cloudPath} fill="url(#skyGrad)" />
            </Svg>

            {/* Content Container (Floating in the sky) */}
            <View className="absolute inset-0 items-center justify-center p-6">
                {children}
            </View>
        </View>
    );
}

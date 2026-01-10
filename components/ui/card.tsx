import * as React from "react";
import { Text, TextProps, View, ViewProps } from "react-native";
import { TextClassContext } from "~/components/ui/text";
import { cn } from "~/lib/utils";

import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-xl border-2 border-b-4",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        primary: "bg-primary border-primary-edge",
        secondary: "bg-secondary border-secondary-edge",
        accent: "bg-accent border-accent-edge",
        muted: "bg-muted border-muted-foreground/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Card component with "Juicy" 3D border effect.
 * Uses inline styles for overflow/borderRadius for reliable clipping in React Native.
 */
function Card({
  className,
  variant,
  children,
  style,
  ...props
}: ViewProps & VariantProps<typeof cardVariants> & {
  ref?: React.RefObject<View>;
}) {
  return (
    <View
      className={cn(cardVariants({ variant }), className)}
      style={[{ overflow: "hidden", borderRadius: 12 }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * ImageCard component for cards containing full-bleed images.
 * Uses border overlay approach for reliable image clipping.
 */
function ImageCard({
  className,
  children,
  style,
  ...props
}: ViewProps & {
  ref?: React.RefObject<View>;
}) {
  return (
    <View
      className={cn("rounded-xl", className)}
      style={[{ position: "relative", overflow: "hidden", borderRadius: 12 }, style]}
      {...props}
    >
      {/* Inner clipping container */}
      <View style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}>
        {children}
      </View>
      {/* Border overlay on top */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 12,
          borderWidth: 2,
          borderBottomWidth: 4,
        }}
        className="border-border"
        pointerEvents="none"
      />
    </View>
  );
}

function CardHeader({
  className,
  ...props
}: ViewProps & {
  ref?: React.RefObject<View>;
}) {
  return (
    <View
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: TextProps & {
  ref?: React.RefObject<Text>;
}) {
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn(
        "text-2xl text-card-foreground font-semibold",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: TextProps & {
  ref?: React.RefObject<Text>;
}) {
  return (
    <Text
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: ViewProps & {
  ref?: React.RefObject<View>;
}) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View className={cn("p-6 pt-0", className)} {...props} />
    </TextClassContext.Provider>
  );
}

function CardFooter({
  className,
  ...props
}: ViewProps & {
  ref?: React.RefObject<View>;
}) {
  return (
    <View
      className={cn("flex flex-row items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

export {
  Card,
  ImageCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

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
 * Card component with optional frame mode for reliable image clipping.
 *
 * @param frameMode - When true, renders border as an overlay frame on top of content.
 *                    This fixes React Native's overflow:hidden + borderRadius + border bug.
 *                    Use this when the Card contains images that need corner clipping.
 */
function Card({
  className,
  variant,
  children,
  frameMode = false,
  style,
  ...props
}: ViewProps & VariantProps<typeof cardVariants> & {
  ref?: React.RefObject<View>;
  frameMode?: boolean;
}) {
  // Default mode: standard Card with border classes
  if (!frameMode) {
    return (
      <View
        className={cn(cardVariants({ variant }), className)}
        style={style}
        {...props}
      >
        {children}
      </View>
    );
  }

  // Frame mode: border rendered on top of content for reliable clipping
  // Children should apply their own borderRadius to clip themselves
  return (
    <View
      className={cn("rounded-xl", className)}
      style={[{ position: "relative" }, style]}
      {...props}
    >
      {children}
      {/* Border frame overlay */}
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
        className={cn(
          variant === "primary" && "border-primary-edge",
          variant === "secondary" && "border-secondary-edge",
          variant === "accent" && "border-accent-edge",
          variant === "muted" && "border-muted-foreground/20",
          (!variant || variant === "default") && "border-border"
        )}
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
        "text-2xl text-card-foreground font-semibold leading-none tracking-tight",
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
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

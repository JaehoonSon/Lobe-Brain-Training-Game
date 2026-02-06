import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Pressable } from "react-native";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "group flex items-center justify-center rounded-xl web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary border-b-4 border-primary-edge active:border-b-0 active:translate-y-1 active:mt-1 web:hover:opacity-90",
        destructive:
          "bg-destructive border-b-4 border-destructive-edge active:border-b-0 active:translate-y-1 active:mt-1 web:hover:opacity-90",
        outline:
          "border-2 border-input bg-background web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent",
        secondary:
          "bg-secondary border-b-4 border-secondary-edge active:border-b-0 active:translate-y-1 active:mt-1 web:hover:opacity-80",
        ghost:
          "web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent",
        link: "web:underline-offset-4 web:hover:underline web:focus:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const buttonTextVariants = cva("text-sm native:text-base font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground group-active:text-accent-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground group-active:text-accent-foreground",
      link: "text-primary group-active:underline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ ref, className, variant, ...props }: ButtonProps) {
  return (
    <Pressable
      className={cn(
        props.disabled && "opacity-50 web:pointer-events-none",
        buttonVariants({ variant, className }),
      )}
      ref={ref}
      role="button"
      {...props}
    />
  );
}

export { Button, buttonVariants, buttonTextVariants };
export type { ButtonProps };

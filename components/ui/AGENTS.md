# UI COMPONENTS GUIDE

shadcn/ui-style primitives using Class Variance Authority (CVA).

## WHERE TO LOOK

| Task            | Location                   |
| --------------- | -------------------------- |
| Add primitive   | `components/ui/`           |
| Button variants | `components/ui/button.tsx` |
| Text styling    | `components/ui/text.tsx`   |
| CVA examples    | Any component in this dir  |

## CONVENTIONS

- **CVA pattern**: Define variants, export component + variants + types
- **Exports**: `export { Component, componentVariants, componentTextVariants }; export type { ComponentProps };`
- **Text nesting**: Use `TextClassContext.Provider` for child text styling
- **Button press effect**: `border-b-4 → active:border-b-0 + active:translate-y-1` for tactile feel
- **Platform prefixes**: `native:*` for RN, `web:*` for web-specific styles
- **Props destructuring**: `ref` first, then `className`, then variant props

```typescript
const componentVariants = cva("base classes...", {
  variants: { variant: { ... }, size: { ... } },
  defaultVariants: { variant: "default", size: "default" },
});

export function Component({ ref, className, variant, size, ...props }: ComponentProps) {
  return (
    <TextClassContext.Provider value={textVariants({ variant, size })}>
      <View className={cn(componentVariants({ variant, size, className }))} ref={ref} {...props} />
    </TextClassContext.Provider>
  );
}
```

## ANTI-PATTERNS

- **NEVER** use inline styles for variant-based components
- **NEVER** skip TextClassContext when component contains Text children
- **NEVER** mix web-only styles without `web:` prefix
- **NEVER** hardcode colors - use semantic tokens (bg-primary, text-foreground)
- **NEVER** create components without CVA for variant-based UI

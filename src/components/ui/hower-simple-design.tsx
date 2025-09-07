import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const howerSimpleDesignVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 w-10",
        sm: "h-8 w-8 [&_svg]:size-3",
        lg: "h-12 w-12 [&_svg]:size-5",
        xl: "h-14 w-14 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface HowerSimpleDesignProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof howerSimpleDesignVariants> {
  asChild?: boolean
}

const HowerSimpleDesign = React.forwardRef<HTMLButtonElement, HowerSimpleDesignProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(howerSimpleDesignVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
HowerSimpleDesign.displayName = "HowerSimpleDesign"

export { HowerSimpleDesign, howerSimpleDesignVariants }
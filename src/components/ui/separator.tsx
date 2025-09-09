"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ 
    className = "", 
    orientation = "horizontal", 
    decorative = true,
    ...props 
  }, ref) => {
    
    const baseClasses = "shrink-0 bg-gray-200"
    
    const orientationClasses = orientation === "horizontal" 
      ? "h-[1px] w-full" 
      : "h-full w-[1px]"
    
    const separatorClasses = cn(
      baseClasses,
      orientationClasses,
      className
    )

    return (
      <div
        ref={ref}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
        className={separatorClasses}
        {...props}
      />
    )
  }
)

Separator.displayName = "Separator"

export { Separator }
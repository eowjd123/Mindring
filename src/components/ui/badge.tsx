"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Badge variant 스타일 정의
const badgeVariants = {
  variant: {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  },
  size: {
    default: "px-2.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  },
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants.variant
  size?: keyof typeof badgeVariants.size
  children: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className = "", 
    variant = "default", 
    size = "default",
    children,
    ...props 
  }, ref) => {
    
    const baseClasses = "inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    
    const variantClasses = badgeVariants.variant[variant]
    const sizeClasses = badgeVariants.size[size]
    
    const badgeClasses = cn(
      baseClasses,
      variantClasses,
      sizeClasses,
      className
    )

    return (
      <div
        ref={ref}
        className={badgeClasses}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = "Badge"

export { Badge, badgeVariants }
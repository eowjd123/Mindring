// app/components/ui/button.tsx
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// 버튼 variant 스타일 정의
const buttonVariants = {
  variant: {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    link: "text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 py-1 text-sm",
    lg: "h-12 px-6 py-3 text-lg",
    icon: "h-10 w-10 p-0",
  },
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant
  size?: keyof typeof buttonVariants.size
  asChild?: boolean
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = "", 
    variant = "default", 
    size = "default", 
    disabled = false,
    type = "button",
    children,
    ...props 
  }, ref) => {
    
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variantClasses = buttonVariants.variant[variant]
    const sizeClasses = buttonVariants.size[size]
    
    const buttonClasses = cn(
      baseClasses,
      variantClasses,
      sizeClasses,
      className
    )

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={buttonClasses}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = "", 
    type = "text",
    error = false,
    helperText,
    disabled = false,
    ...props 
  }, ref) => {
    
    const baseClasses = "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    
    const variantClasses = error 
      ? "border-red-500 focus-visible:ring-red-500" 
      : "border-gray-300 focus-visible:ring-blue-500"
    
    const backgroundClasses = disabled 
      ? "bg-gray-50" 
      : "bg-white"
    
    const inputClasses = cn(
      baseClasses,
      variantClasses,
      backgroundClasses,
      className
    )

    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        {helperText && (
          <p className={cn(
            "mt-1 text-xs",
            error ? "text-red-600" : "text-gray-500"
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
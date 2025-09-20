// components/ui/textarea.tsx

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  helperText?: string
  resize?: "none" | "both" | "horizontal" | "vertical"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className = "", 
    error = false,
    helperText,
    disabled = false,
    resize = "vertical",
    rows = 3,
    ...props 
  }, ref) => {
    
    const baseClasses = "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    
    const variantClasses = error 
      ? "border-red-500 focus-visible:ring-red-500" 
      : "border-gray-300 focus-visible:ring-blue-500"
    
    const backgroundClasses = disabled 
      ? "bg-gray-50" 
      : "bg-white"

    const resizeClasses = {
      none: "resize-none",
      both: "resize",
      horizontal: "resize-x",
      vertical: "resize-y"
    }
    
    const textareaClasses = cn(
      baseClasses,
      variantClasses,
      backgroundClasses,
      resizeClasses[resize],
      className
    )

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={textareaClasses}
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

Textarea.displayName = "Textarea"

export { Textarea }
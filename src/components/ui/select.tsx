// components/ui/select.tsx

"use client"

import * as React from "react"

import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface SelectContextValue {
  value: string
  // eslint-disable-next-line no-unused-vars
  onValueChange: (_value: string) => void
  open: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (_open: boolean) => void
  placeholder?: string
  contentId: string
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

const useSelectContext = () => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select')
  }
  return context
}

interface SelectProps {
  value?: string
  // eslint-disable-next-line no-unused-vars
  onValueChange?: (_value: string) => void
  defaultValue?: string
  children: React.ReactNode
  disabled?: boolean
}

const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  children,
  disabled = false,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const contentId = React.useId()

  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }, [controlledValue, onValueChange])

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!disabled) {
      setOpen(newOpen)
    }
  }, [disabled])

  // ESC 키로 닫기
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  // 외부 클릭으로 닫기
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (open) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const contextValue: SelectContextValue = {
    value,
    onValueChange: handleValueChange,
    open,
    onOpenChange: handleOpenChange,
    contentId,
  }

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, onOpenChange, contentId } = useSelectContext()

  return (
    <button
      ref={ref}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-controls={contentId}
      aria-haspopup="listbox"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        onOpenChange(!open)
      }}
      {...props}
    >
      {children}
      <ChevronDown className={cn(
        "h-4 w-4 opacity-50 transition-transform duration-200",
        open && "rotate-180"
      )} />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string
  }
>(({ className, placeholder, ...props }, ref) => {
  const { value } = useSelectContext()

  return (
    <span
      ref={ref}
      className={cn(
        "block truncate",
        !value && "text-gray-500",
        className
      )}
      {...props}
    >
      {value || placeholder}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, contentId } = useSelectContext()

  if (!open) return null

  return (
    <div
      ref={ref}
      id={contentId}
      className={cn(
        "absolute top-full left-0 z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in-0 zoom-in-95",
        className
      )}
      role="listbox"
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    children: React.ReactNode
  }
>(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = useSelectContext()
  const isSelected = selectedValue === value

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      className={cn(
        "relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900",
        isSelected && "bg-blue-50 text-blue-900",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      <span className={cn("block truncate", isSelected && "font-medium")}>
        {children}
      </span>
      {isSelected && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
          <Check className="h-4 w-4" />
        </span>
      )}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-1.5 pl-3 pr-2 text-sm font-semibold text-gray-900", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
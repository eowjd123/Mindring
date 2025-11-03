//  components/ui/tabs.tsx

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  // eslint-disable-next-line no-unused-vars
  onValueChange: (_value: string) => void
  orientation?: "horizontal" | "vertical"
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

const useTabsContext = () => {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs')
  }
  return context
}

interface TabsProps {
  value?: string
  // eslint-disable-next-line no-unused-vars
  onValueChange?: (_value: string) => void
  defaultValue?: string
  orientation?: "horizontal" | "vertical"
  children: React.ReactNode
  className?: string
}

const Tabs: React.FC<TabsProps> = ({
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  orientation = "horizontal",
  children,
  className = "",
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)

  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }, [controlledValue, onValueChange])

  const contextValue: TabsContextValue = {
    value,
    onValueChange: handleValueChange,
    orientation,
  }

  return (
    <TabsContext.Provider value={contextValue}>
      <div 
        className={cn(
          orientation === "vertical" ? "flex gap-4" : "",
          className
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useTabsContext()

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
        orientation === "vertical" ? "flex-col h-auto w-auto" : "h-10 w-auto",
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
  }
>(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange, orientation } = useTabsContext()
  const isSelected = selectedValue === value

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={`tabpanel-${value}`}
      data-state={isSelected ? "active" : "inactive"}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected 
          ? "bg-white text-gray-950 shadow-sm" 
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
        orientation === "vertical" ? "w-full justify-start" : "",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
  }
>(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue } = useTabsContext()
  const isSelected = selectedValue === value

  if (!isSelected) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={cn(
        "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
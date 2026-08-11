"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  tabs: { value: string; label: string; icon?: React.ReactNode }[]
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface TabPanelProps {
  value: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ tabs, value, onValueChange, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(value || tabs[0]?.value || "")
  const currentTab = value ?? activeTab

  const handleChange = (val: string) => {
    setActiveTab(val)
    onValueChange?.(val)
  }

  return (
    <div className={className}>
      <div
        className="flex gap-1 border-b"
        style={{ borderColor: "var(--border-default)" }}
        role="tablist"
      >
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
            )}
            style={{
              borderColor: currentTab === tab.value ? "var(--accent)" : "transparent",
              color: currentTab === tab.value ? "var(--accent)" : "var(--text-muted)",
            }}
            role="tab"
            aria-selected={currentTab === tab.value}
            aria-controls={`tabpanel-${tab.value}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && (child.props as { value?: string }).value === currentTab) {
            return child
          }
          return null
        })}
      </div>
    </div>
  )
}

export function TabPanel({ value, activeTab, children, className }: TabPanelProps & { activeTab: string }) {
  if (value !== activeTab) return null
  return (
    <div
      id={`tabpanel-${value}`}
      role="tabpanel"
      className={className}
    >
      {children}
    </div>
  )
}

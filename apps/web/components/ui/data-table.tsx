"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react"

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  emptyMessage?: string
  className?: string
}

type SortDirection = "asc" | "desc" | null

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDirection>(null)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"))
      if (sortDir === "desc") setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const valueAt = (item: T, key: string): unknown => (item as Record<string, unknown>)[key]

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const aVal = valueAt(a, sortKey)
      const bVal = valueAt(b, sortKey)
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }, [data, sortKey, sortDir])

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px]" role="grid">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider",
                  col.sortable && "cursor-pointer select-none"
                )}
                style={{ color: "var(--text-muted)" }}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && (
                    <span className="inline-flex">
                      {sortKey === col.key && sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : sortKey === col.key && sortDir === "desc" ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--border-default)" }}>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item, i) => (
              <tr
                key={i}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-[var(--bg-tertiary)]"
                )}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map(col => (
                  <td key={col.key} className={cn("px-4 py-3 text-sm", col.className)} style={{ color: "var(--text-primary)" }}>
                    {col.render ? col.render(item) : String(valueAt(item, col.key) ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

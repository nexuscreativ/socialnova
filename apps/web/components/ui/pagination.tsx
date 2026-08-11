"use client"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: "var(--text-secondary)" }}
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {getPageNumbers().map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm" style={{ color: "var(--text-muted)" }}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "inline-flex items-center justify-center h-8 min-w-[32px] rounded-lg text-sm font-medium transition-colors"
            )}
            style={{
              backgroundColor: currentPage === page ? "var(--accent)" : "transparent",
              color: currentPage === page ? "white" : "var(--text-secondary)",
            }}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

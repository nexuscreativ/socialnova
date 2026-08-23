"use client"
import { useEffect, useState } from "react"
import { Images, Trash2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { fetchMediaLibrary, deleteMedia, type MediaItem } from "@/lib/site-content"

interface MediaLibraryProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

function formatSize(bytes: number): string {
  if (!bytes) return "—"
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export function MediaLibrary({ open, onClose, onSelect }: MediaLibraryProps) {
  const { addToast } = useToast()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await fetchMediaLibrary())
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load media", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  const handleDelete = async (filename: string) => {
    setDeleting(filename)
    try {
      await deleteMedia(filename)
      setItems(prev => prev.filter(i => i.filename !== filename))
      addToast("Asset deleted", "success")
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed", "error")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Media Library" size="lg">
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--text-muted)" }}>
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading assets…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Images className="h-8 w-8 mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No media yet. Upload an image from any image field and it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map(item => (
              <div
                key={item.filename}
                className="group relative rounded-lg border overflow-hidden"
                style={{ borderColor: "var(--border-default)" }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item.url)}
                  className="block w-full aspect-square bg-[var(--bg-tertiary)]"
                  title={`Select ${item.original_name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.original_name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
                <div className="px-2 py-1.5 text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                  {item.original_name}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.filename)}
                  disabled={deleting === item.filename}
                  className="absolute top-1.5 right-1.5 rounded-full p-1.5 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="Delete asset"
                >
                  {deleting === item.filename ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          <X className="h-4 w-4 mr-1.5" /> Close
        </Button>
      </div>
    </Modal>
  )
}

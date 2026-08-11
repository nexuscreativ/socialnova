"use client"
import { useState, useRef } from "react"
import { ImagePlus, X, Loader2, UploadCloud, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { uploadImage } from "@/lib/site-content"
import { cn } from "@/lib/utils"

interface ImageUploadFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  className?: string
}

/**
 * Image field for the CMS editor. Accepts a direct URL, OR uploads a local
 * image through the /api/uploads proxy and stores the returned public URL.
 */
export function ImageUploadField({ label, value, onChange, className }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrl, setShowUrl] = useState(false)
  const [manualUrl, setManualUrl] = useState(value)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const applyUrl = () => {
    onChange(manualUrl.trim())
    setShowUrl(false)
    setError(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <span className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
      ) : null}

      <div className="flex items-center gap-3">
        <div
          className="h-16 w-16 rounded-lg border flex items-center justify-center overflow-hidden shrink-0"
          style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-tertiary)" }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            // Plain <img> because images come from a remote backend upload dir.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
          ) : (
            <ImagePlus className="h-6 w-6" style={{ color: "var(--text-muted)" }} />
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <UploadCloud className="h-4 w-4 mr-1.5" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowUrl(v => {
              setManualUrl(value)
              return !v
            })}>
              <Link2 className="h-4 w-4 mr-1.5" />
              Use URL
            </Button>
            {value ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")} className="text-[var(--color-error)]">
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {showUrl ? (
            <div className="flex items-center gap-2">
              <Input
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" onClick={applyUrl} disabled={!manualUrl.trim()}>
                Apply
              </Button>
            </div>
          ) : null}

          {value ? (
            <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {value}
            </span>
          ) : null}
          {error ? (
            <span className="text-xs" style={{ color: "var(--color-error)" }}>{error}</span>
          ) : null}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
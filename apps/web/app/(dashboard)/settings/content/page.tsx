"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, FileText, Globe, Pencil, Trash2, Eye, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { fetchPages, createPage, deletePage, type SitePage } from "@/lib/site-content"

function statusVariant(status: SitePage["status"]): "default" | "success" | "info" {
  if (status === "published") return "success"
  if (status === "draft") return "info"
  return "default"
}

export default function SiteContentPage() {
  const { addToast } = useToast()
  const [pages, setPages] = useState<SitePage[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newSlug, setNewSlug] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchPages()
      setPages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pages")
      setPages([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!newSlug.trim() || !newTitle.trim() || creating) return
    setCreating(true)
    try {
      await createPage({ slug: newSlug.trim(), title: newTitle.trim() })
      addToast("Page created as draft", "success")
      setShowCreate(false)
      setNewSlug("")
      setNewTitle("")
      await load()
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to create page", "error")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (page: SitePage) => {
    if (deleting) return
    if (!window.confirm(`Archive "${page.slug}"? It will stay recoverable via version history.`)) return
    setDeleting(page.id)
    try {
      await deletePage(page.slug)
      addToast("Page archived", "success")
      await load()
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to archive page", "error")
    } finally {
      setDeleting(null)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="h-10 w-10 mb-4" style={{ color: "var(--color-error)" }} />
        <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{error}</p>
        <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          Make sure you are signed in as an admin.
        </p>
        <Button onClick={load}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create page" size="md">
        <div className="space-y-4">
          <div>
            <label htmlFor="cmsTitle" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Title
            </label>
            <Input
              id="cmsTitle"
              placeholder="e.g., Customers"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cmsSlug" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Slug
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>/</span>
              <Input
                id="cmsSlug"
                placeholder="customers"
                value={newSlug}
                onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newSlug.trim() || !newTitle.trim() || creating}>
              {creating ? "Creating..." : "Create page"}
            </Button>
          </div>
        </div>
      </Modal>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Site Pages</CardTitle>
              <CardDescription>Edit the marketing pages customers see on /path routes</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New page
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pages === null ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : pages.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
              No pages yet. Create your first page.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                    <th className="text-left py-3 pr-4 font-medium" style={{ color: "var(--text-secondary)" }}>Page</th>
                    <th className="text-left py-3 pr-4 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
                    <th className="text-left py-3 pr-4 font-medium" style={{ color: "var(--text-secondary)" }}>Version</th>
                    <th className="text-left py-3 pr-4 font-medium" style={{ color: "var(--text-secondary)" }}>Nav</th>
                    <th className="text-right py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map(page => (
                    <motion.tr
                      key={page.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b"
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
                          >
                            <FileText className="h-4 w-4" style={{ color: "var(--accent)" }} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate" style={{ color: "var(--text-primary)" }}>{page.title}</div>
                            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                              /{page.slug}
                              {page.status === "published" && (
                                <Link href={`/${page.slug}`} target="_blank" className="inline-flex items-center gap-0.5 hover:opacity-80" style={{ color: "var(--accent)" }}>
                                  <Globe className="h-3 w-3" /> view
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant(page.status)}>{page.status}</Badge>
                      </td>
                      <td className="py-3 pr-4" style={{ color: "var(--text-secondary)" }}>
                        v{page.version}
                      </td>
                      <td className="py-3 pr-4" style={{ color: "var(--text-secondary)" }}>
                        {page.nav_order != null ? `#${page.nav_order} · ${page.nav_label ?? page.title}` : "hidden"}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/settings/content/${page.slug}`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/settings/content/${page.slug}#history`}>
                            <Button variant="ghost" size="sm">
                              <History className="h-4 w-4" />
                            </Button>
                          </Link>
                          {page.status === "published" && (
                            <Link href={`/${page.slug}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(page)}
                            disabled={deleting === page.id}
                            className="text-[var(--color-error)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
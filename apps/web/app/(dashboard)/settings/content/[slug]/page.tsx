"use client"
import { useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  History,
  Save,
  Send,
  Undo2,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchPage,
  updatePageMeta,
  savePageContent,
  publishPage,
  rollbackPage,
  fetchPageHistory,
  type SitePage,
  type SectionDraft,
  type HistoryEntry,
} from "@/lib/site-content"
import {
  SectionFieldEditor,
  SECTION_LABELS,
  AVAILABLE_SECTION_KEYS,
} from "@/components/cms/section-field-form"

export default function PageEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { addToast } = useToast()

  const [page, setPage] = useState<SitePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // editable metadata
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [navLabel, setNavLabel] = useState("")
  const [navOrder, setNavOrder] = useState("")
  const [abTestEnabled, setAbTestEnabled] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("approved")

  // editable payload + sections
  const [payload, setPayload] = useState<Record<string, unknown>>({})
  const [sections, setSections] = useState<SectionDraft[]>([])

  // editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // history
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [rollingBack, setRollingBack] = useState<number | null>(null)

  async function load() {
    try {
      setLoading(true)
      const data = await fetchPage(slug)
      setPage(data)
      setTitle(data.title)
      setDescription(data.description ?? "")
      setNavLabel(data.nav_label ?? "")
      setNavOrder(data.nav_order == null ? "" : String(data.nav_order))
      setAbTestEnabled(Boolean((data as unknown as Record<string, unknown>).ab_test_enabled))
      setApprovalStatus(((data as unknown as Record<string, unknown>).approval_status as "pending" | "approved" | "rejected") ?? "approved")
      setPayload({ ...(data.draft_payload ?? {}) })
      setSections((data.sections ?? []).map(s => ({
        section_key: s.section_key,
        order: s.order,
        is_enabled: s.is_enabled,
        payload: s.draft_payload ?? {},
      })))
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load page")
    } finally {
      setLoading(false)
    }
  }

  async function openHistory() {
    setHistoryOpen(true)
    setLoadingHistory(true)
    try {
      const data = await fetchPageHistory(slug)
      setHistory(data.history ?? [])
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load history", "error")
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings/content" className="inline-flex items-center gap-1 text-sm mb-3 hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="h-4 w-4" />
          Back to content
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-plus-jakarta)", color: "var(--text-primary)" }}>
              Edit /{slug}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Editing the draft — changes save as a draft until you publish.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push("/settings/content")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={openHistory}>
              <History className="h-4 w-4 mr-1.5" />
              History
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.open(`/${slug}`, "_blank")}>
              <Eye className="h-4 w-4 mr-1.5" />
              Live preview
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !page}>
              {saving ? "Saving..." : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save
                </>
              )}
            </Button>
            <Button size="sm" variant="primary" onClick={handlePublish} disabled={publishing || !page}>
              {publishing ? "Publishing..." : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--color-error)" }}>{loadError}</p>
            <Button className="mt-4" variant="secondary" onClick={load}>Try again</Button>
          </CardContent>
        </Card>
      ) : page ? (
        <>
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Page metadata</CardTitle>
              <CardDescription>
                Title shows in the browser tab; nav label + order control visibility in the site header.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="cmsTitle" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Title</label>
                <Input id="cmsTitle" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label htmlFor="cmsDesc" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Description</label>
                <Textarea id="cmsDesc" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="SEO / page description" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cmsNavLabel" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Nav label</label>
                  <Input id="cmsNavLabel" value={navLabel} onChange={e => setNavLabel(e.target.value)} placeholder="Leave empty to hide from header" />
                </div>
                <div>
                  <label htmlFor="cmsNavOrder" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Nav order</label>
                  <Input id="cmsNavOrder" value={navOrder} onChange={e => setNavOrder(e.target.value)} placeholder="1, 2, 3... / empty = hidden" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={abTestEnabled} onChange={e => setAbTestEnabled(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: "var(--accent)" }} />
                  A/B test enabled (serve variant to 50% of visitors)
                </label>
                <div>
                  <label htmlFor="cmsApproval" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Approval</label>
                  <select
                    id="cmsApproval"
                    value={approvalStatus}
                    onChange={e => setApprovalStatus(e.target.value as "pending" | "approved" | "rejected")}
                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                    style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  >
                    <option value="pending">Pending review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>Order defines render order on the page.</CardDescription>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setShowAddSection(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                  No sections yet. Add your first section to build the page.
                </p>
              ) : (
                <div className="space-y-3">
                  {sections.map((s, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border p-4"
                        style={{ borderColor: "var(--border-default)" }}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingId(s.section_key)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                {SECTION_LABELS[s.section_key] ?? s.section_key}
                              </span>
                              {!s.is_enabled && <Badge variant="default">disabled</Badge>}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {s.section_key} · order {s.order}
                            </div>
                          </button>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" aria-label="Move up" onClick={() => moveSection(idx, -1)}>
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="Move down" onClick={() => moveSection(idx, 1)}>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="Remove" className="text-[var(--color-error)]" onClick={() => removeSection(idx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <AnimatePresence>
                          {editingId === s.section_key && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 mt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
                                <div className="flex items-center gap-2 mb-4">
                                  <input
                                    type="checkbox"
                                    checked={s.is_enabled}
                                    onChange={e => updateSection(idx, { is_enabled: e.target.checked })}
                                    className="h-4 w-4 rounded border"
                                    style={{ accentColor: "var(--accent)" }}
                                    id={`enable-${s.section_key}`}
                                  />
                                  <label htmlFor={`enable-${s.section_key}`} className="text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                                    Enabled on page
                                  </label>
                                </div>
                                <SectionFieldEditor
                                  sectionKey={s.section_key}
                                  label={SECTION_LABELS[s.section_key] ?? s.section_key}
                                  payload={s.payload ?? {}}
                                  onChange={(payload) => updateSection(idx, { payload })}
                                />
                                <div className="flex justify-end mt-4">
                                  <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                                    Done
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History modal */}
          <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Version history" description={`Published snapshots for /${slug}`} size="lg">
            {loadingHistory ? (
              <div className="space-y-2">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
                No published versions yet — publish once to create a snapshot.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
                    <div className="flex items-center gap-2 text-sm">
                      <Layers className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>v{h.version}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {h.action} · {h.created_at ?? ""}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={rollingBack === h.version}
                      onClick={() => handleRollback(h.version)}
                    >
                      <Undo2 className="h-4 w-4 mr-1.5" />
                      {rollingBack === h.version ? "Restoring..." : "Restore"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Modal>

          {/* Add section modal */}
          <Modal open={showAddSection} onClose={() => setShowAddSection(false)} title="Add section" size="md">
            <div className="space-y-1">
              {AVAILABLE_SECTION_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => addSection(key)}
                  className="w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm hover:bg-[var(--bg-tertiary)]"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                >
                  <span className="font-medium">{SECTION_LABELS[key] ?? key}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{key}</span>
                </button>
              ))}
              <p className="text-xs pt-2" style={{ color: "var(--text-muted)" }}>
                Sections save with the page. Disable instead of deleting if you want to keep content.
              </p>
            </div>
          </Modal>
        </>
      ) : null}
    </div>
  )

  async function handleSave() {
    if (!page || saving) return
    setSaving(true)
    try {
      await updatePageMeta(slug, {
        title,
        description: description || undefined,
        nav_label: navLabel || undefined,
        nav_order: navOrder === "" ? null : Number(navOrder),
        ab_test_enabled: abTestEnabled,
        approval_status: approvalStatus,
      })
      await savePageContent(slug, {
        payload: payload ?? {},
        sections: sections.map((s, i) => ({
          ...s,
          order: s.order ?? i + 1,
          payload: s.payload ?? {},
        })),
      })
      addToast("Draft saved", "success")
      await load()
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!page || publishing) return
    setPublishing(true)
    try {
      await publishPage(slug)
      addToast("Published", "success")
      await load()
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to publish", "error")
    } finally {
      setPublishing(false)
    }
  }

  async function handleRollback(version: number) {
    if (rollingBack != null) return
    setRollingBack(version)
    try {
      await rollbackPage(slug, version)
      addToast(`Restored v${version} as draft`, "success")
      await load()
      await openHistory()
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to restore", "error")
    } finally {
      setRollingBack(null)
    }
  }

  function moveSection(idx: number, dir: -1 | 1) {
    setSections(prev => {
      const next = prev.slice()
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  function removeSection(idx: number) {
    setSections(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })))
  }

  function updateSection(idx: number, patch: Partial<SectionDraft>) {
    setSections(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  function addSection(sectionKey: string) {
    setSections(prev => [...prev, {
      section_key: sectionKey,
      order: prev.length + 1,
      is_enabled: true,
      payload: {},
    }])
    setShowAddSection(false)
  }
}
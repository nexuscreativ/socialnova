export type PageStatus = "draft" | "published" | "archived"

export interface SectionDraft {
  section_key: string
  order: number
  is_enabled: boolean
  payload: Record<string, unknown>
}

export interface SiteSection {
  id: string
  section_key: string
  order: number
  is_enabled: boolean
  published_payload: Record<string, unknown>
  draft_payload: Record<string, unknown>
}

export interface SitePage {
  id: string
  slug: string
  title: string
  description: string | null
  nav_label: string | null
  nav_order: number | null
  status: PageStatus
  version: number
  published_payload: Record<string, unknown>
  draft_payload: Record<string, unknown>
  sections: SiteSection[]
  created_at: string | null
  updated_at: string | null
}

export interface PublicSection {
  section_key: string
  order: number
  payload: Record<string, unknown>
}

export interface PublicPage {
  slug: string
  title: string
  description: string | null
  payload: Record<string, unknown>
  sections: PublicSection[]
  version: number
  updated_at: string | null
}

export interface HistoryEntry {
  id: string
  version: number
  action: string
  created_at: string | null
}

export interface PageHistory {
  page_id: string
  slug: string
  version: number
  total: number
  page: number
  per_page: number
  history: HistoryEntry[]
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    ...(init?.body ? { headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } } : {}),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data?.error ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return data as T
}

/** Public render of a page by slug (published state). Server-safe: uses the
 * backend origin directly when available, so SSR doesn't depend on the proxy. */
export async function fetchPublicPage(slug: string): Promise<PublicPage> {
  const backend = process.env.NOVA_API_URL
  const base = backend ? `${backend.replace(/\/$/, "")}/site/pages` : "/api/site/pages"
  const res = await fetch(`${base}/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.detail ?? data?.error ?? `Page not found (${res.status})`)
  }
  return data as PublicPage
}

/** Public nav links (published pages with nav_order). Server-safe. */
export async function fetchNav(): Promise<{ slug: string; label: string }[]> {
  const backend = process.env.NOVA_API_URL
  const base = backend ? `${backend.replace(/\/$/, "")}/site/pages` : "/api/site/pages"
  const res = await fetch(`${base}/nav`, {
    cache: "no-store",
    next: { revalidate: 0 },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.detail ?? data?.error ?? `Nav unavailable (${res.status})`)
  }
  return data as { slug: string; label: string }[]
}

/** Admin: all pages (drafts included). */
export async function fetchPages(): Promise<SitePage[]> {
  const data = await request<{ pages: SitePage[]; total: number }>("/api/site/pages")
  return data.pages
}

/** Admin: single page with draft views. */
export async function fetchPage(slug: string): Promise<SitePage> {
  return request<SitePage>(`/api/site/pages/${encodeURIComponent(slug)}?view=draft`)
}

export async function createPage(body: {
  slug: string
  title: string
  description?: string
}): Promise<SitePage> {
  return request<SitePage>("/api/site/pages", { method: "POST", body: JSON.stringify(body) })
}

export async function updatePageMeta(
  slug: string,
  body: {
    title?: string
    description?: string
    nav_label?: string
    nav_order?: number | null
    status?: PageStatus
  },
): Promise<SitePage> {
  return request<SitePage>(`/api/site/pages/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function savePageContent(
  slug: string,
  body: {
    payload: Record<string, unknown>
    sections: SectionDraft[]
  },
): Promise<SitePage> {
  return request<SitePage>(`/api/site/pages/${encodeURIComponent(slug)}/content`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function publishPage(slug: string): Promise<SitePage> {
  return request<SitePage>(`/api/site/pages/${encodeURIComponent(slug)}/publish`, {
    method: "POST",
    body: "{}",
  })
}

export async function rollbackPage(slug: string, version: number): Promise<SitePage> {
  return request<SitePage>(
    `/api/site/pages/${encodeURIComponent(slug)}/rollback/${version}`,
    { method: "POST", body: "{}" },
  )
}

export async function fetchPageHistory(slug: string): Promise<PageHistory> {
  return request<PageHistory>(`/api/site/pages/${encodeURIComponent(slug)}/history`)
}

export async function deletePage(slug: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/site/pages/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  })
}

/** Upload a file to the backend (multipart) and return its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch("/api/uploads/media", { method: "POST", body: form })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error ?? data?.detail ?? "Upload failed")
  }
  return data?.url ?? ""
}
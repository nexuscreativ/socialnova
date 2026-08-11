"use client"
import { useState } from "react"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageUploadField } from "./image-upload-field"

/* -------------------------------------------------------------------------- */
/*  Field schema                                                              */
/* -------------------------------------------------------------------------- */

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "image"
  | "object"
  | "list"

export interface FieldSchema {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  rows?: number
  /** Children for object fields */
  fields?: FieldSchema[]
  /** Children for list fields */
  itemFields?: FieldSchema[]
  itemKey?: string
  /** For boolean/selectable values */
  options?: { value: string; label: string }[]
}

export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  features: "Features",
  pricing: "Pricing",
  faq: "FAQ",
  article: "Article",
  stats: "Stats",
  integrations: "Integrations",
  cta: "Call to action",
}

export const SECTION_SCHEMAS: Record<string, FieldSchema[]> = {
  hero: [
    { key: "badge", label: "Badge", type: "text", placeholder: "AI-Powered Social Media Management" },
    { key: "headline", label: "Headline", type: "textarea", rows: 2, placeholder: "Headline text" },
    { key: "subheadline", label: "Sub-headline", type: "textarea", rows: 3, placeholder: "Supporting copy" },
    {
      key: "primary_cta", label: "Primary CTA", type: "object",
      fields: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "Link", type: "text" },
      ],
    },
    {
      key: "secondary_cta", label: "Secondary CTA", type: "object",
      fields: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "Link", type: "text" },
      ],
    },
    {
      key: "stats", label: "Stats", type: "list", itemKey: "label",
      itemFields: [
        { key: "label", label: "Label", type: "text" },
        { key: "value", label: "Value", type: "text" },
        { key: "suffix", label: "Suffix", type: "text" },
      ],
    },
  ],
  features: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Sub-heading", type: "textarea", rows: 2 },
    {
      key: "items", label: "Feature cards", type: "list", itemKey: "title",
      itemFields: [
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea", rows: 2 },
        {
          key: "icon", label: "Icon", type: "text",
          placeholder: "bot | calendar | barchart | message | shield | zap",
        },
      ],
    },
  ],
  pricing: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Sub-heading", type: "textarea", rows: 2 },
    {
      key: "tiers", label: "Plans", type: "list", itemKey: "name",
      itemFields: [
        { key: "name", label: "Name", type: "text" },
        { key: "price", label: "Price", type: "text" },
        { key: "period", label: "Period", type: "text", placeholder: "/mo" },
        { key: "description", label: "Description", type: "textarea", rows: 2 },
        {
          key: "features", label: "Feature list", type: "list", itemKey: "text",
          itemFields: [{ key: "value", label: "Feature", type: "text" }],
        },
        { key: "cta", label: "CTA label", type: "text" },
        { key: "popular", label: "Most popular", type: "boolean" },
      ],
    },
  ],
  faq: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items", label: "Questions", type: "list", itemKey: "question",
      itemFields: [
        { key: "question", label: "Question", type: "textarea", rows: 2 },
        { key: "answer", label: "Answer", type: "textarea", rows: 4 },
      ],
    },
  ],
  article: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Body (plain text; lines starting · / headers render styled)", type: "textarea", rows: 14 },
  ],
  stats: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "stats", label: "Numbers", type: "list", itemKey: "label",
      itemFields: [
        { key: "label", label: "Label", type: "text" },
        { key: "value", label: "Value", type: "text" },
        { key: "suffix", label: "Suffix", type: "text" },
      ],
    },
  ],
  integrations: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Sub-heading", type: "textarea", rows: 2 },
    {
      key: "items", label: "Platforms", type: "list", itemKey: "name",
      itemFields: [
        { key: "name", label: "Name", type: "text" },
        { key: "description", label: "Description", type: "text" },
      ],
    },
  ],
  cta: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Sub-heading", type: "textarea", rows: 2 },
    {
      key: "primary_cta", label: "Primary CTA", type: "object",
      fields: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "Link", type: "text" },
      ],
    },
  ],
}

export const AVAILABLE_SECTION_KEYS = Object.keys(SECTION_SCHEMAS)

export interface SectionFieldEditorProps {
  sectionKey: string
  label: string
  payload: Record<string, unknown>
  onChange: (payload: Record<string, unknown>) => void
}

/* -------------------------------------------------------------------------- */
/*  Recursive field renderer                                                   */
/* -------------------------------------------------------------------------- */

function stringVal(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function boolVal(v: unknown): boolean {
  return typeof v === "boolean" ? v : Boolean(v)
}

function numVal(v: unknown): string {
  return v == null ? "" : String(v)
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSchema
  value: unknown
  onChange: (v: unknown) => void
}) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          rows={field.rows ?? 3}
          placeholder={field.placeholder}
          value={stringVal(value)}
          onChange={e => onChange(e.target.value)}
          className="text-sm"
        />
      )
    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder}
          value={numVal(value)}
          onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="text-sm"
        />
      )
    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>
          <input
            type="checkbox"
            checked={boolVal(value)}
            onChange={e => onChange(e.target.checked)}
            className="h-4 w-4 rounded border"
            style={{ accentColor: "var(--accent)" }}
          />
          <span>{field.label}</span>
        </label>
      )
    case "image":
      return <ImageUploadField value={stringVal(value)} onChange={v => onChange(v)} />
    default:
      return (
        <Input
          placeholder={field.placeholder}
          value={stringVal(value)}
          onChange={e => onChange(e.target.value)}
          className="text-sm"
        />
      )
  }
}

function ObjectFields({
  fields,
  value,
  onChange,
}: {
  fields: FieldSchema[]
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-3">
      {fields.map(field => (
        <Field
          key={field.key}
          field={field}
          value={value?.[field.key]}
          onChange={(v) => onChange({ ...value, [field.key]: v })}
        />
      ))}
    </div>
  )
}

function ListFields({
  field,
  value,
  onChange,
}: {
  field: FieldSchema
  value: unknown
  onChange: (v: unknown[]) => void
}) {
  const items = Array.isArray(value) ? value : []
  const [open, setOpen] = useState<Set<number>>(new Set(items.length ? [0] : []))
  const itemFields = field.itemFields ?? []

  const updateItem = (idx: number, patch: Record<string, unknown>) => {
    const next = items.slice()
    next[idx] = { ...(next[idx] as Record<string, unknown> ?? {}), ...patch }
    onChange(next)
  }

  const move = (idx: number, dir: -1 | 1) => {
    const next = items.slice()
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const record = (item ?? {}) as Record<string, unknown>
        const title = field.itemKey
          ? stringVal(record[field.itemKey]) || `Item ${idx + 1}`
          : `Item ${idx + 1}`
        const isOpen = open.has(idx)
        return (
          <div key={idx} className="rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-2 px-3 py-2">
              <GripVertical className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
              <button
                type="button"
                className="flex-1 text-left text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
                onClick={() => setOpen(prev => {
                  const next = new Set(prev)
                  if (next.has(idx)) next.delete(idx)
                  else next.add(idx)
                  return next
                })}
              >
                {title}
              </button>
              <button type="button" onClick={() => move(idx, -1)} aria-label="Move up" className="rounded p-1 hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-muted)" }}>
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(idx, 1)} aria-label="Move down" className="rounded p-1 hover:bg-[var(--bg-tertiary)]" style={{ color: "var(--text-muted)" }}>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                aria-label="Remove item"
                className="rounded p-1 hover:bg-[var(--bg-tertiary)]"
                style={{ color: "var(--color-error)" }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {isOpen ? (
              <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: "var(--border-default)" }}>
                <ObjectFields fields={itemFields} value={record} onChange={(patch) => updateItem(idx, patch)} />
              </div>
            ) : null}
          </div>
        )
      })}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          onChange([...items, {}])
          setOpen(prev => new Set(prev).add(items.length))
        }}
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add {field.label.toLowerCase()?.endsWith("s") ? field.label.toLowerCase().slice(0, -1) : "item"}
      </Button>
    </div>
  )
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldSchema
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (field.type === "object") {
    return (
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          {field.label}
        </label>
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-default)" }}>
          <ObjectFields fields={field.fields ?? []} value={(value ?? {}) as Record<string, unknown>} onChange={(v) => onChange(v)} />
        </div>
      </div>
    )
  }
  if (field.type === "list") {
    return (
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          {field.label}
        </label>
        <ListFields field={field} value={value} onChange={onChange as (v: unknown[]) => void} />
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      {field.type !== "boolean" ? (
        <label className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {field.label}
        </label>
      ) : null}
      <FieldInput
        field={field}
        value={value}
        onChange={(v) => {
          // Remove the key entirely when an empty string is set (clean payloads).
          if ((typeof v === "string" && v === "")) {
            onChange(undefined)
          } else {
            onChange(v)
          }
        }}
      />
    </div>
  )
}

export function SectionFieldEditor({ sectionKey, label, payload, onChange }: SectionFieldEditorProps) {
  const schema = SECTION_SCHEMAS[sectionKey]
  if (!schema) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label} — raw JSON (no field editor for this section)
        </label>
        <Textarea
          rows={10}
          className="font-mono text-xs"
          value={JSON.stringify(payload ?? {}, null, 2)}
          onChange={e => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              /* invalid JSON while typing — keep previous value */
            }
          }}
        />
      </div>
    )
  }
  return (
    <div className="space-y-5">
      <ObjectFields
        fields={schema}
        value={payload ?? {}}
        onChange={onChange}
      />
    </div>
  )
}
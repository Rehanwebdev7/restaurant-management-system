import { useState, useMemo, type ReactNode } from 'react'
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { CrudHooks } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

/**
 * 2026-07-16: Generic CRUD page for super admin resources.
 * Every list page (Categories, States, Cities, Sections, etc.) reduces to
 * ~40 lines of config: title + columns + form fields + hooks bundle.
 * Handles list + row-detail modal + create/edit modal + delete confirm.
 */

export type FieldKind = 'text' | 'number' | 'textarea' | 'checkbox' | 'select'

export interface FormField<T> {
  key: keyof T & string
  label: string
  kind?: FieldKind
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: Array<{ label: string; value: string | number }>
  /** Optional row-specific override to hide/disable this field when editing */
  editOnly?: boolean
  createOnly?: boolean
}

export interface DetailField<T> {
  key: keyof T & string
  label: string
  format?: (value: unknown, row: T) => ReactNode
}

interface AdminCrudPageProps<T extends AdminEntity> {
  title: string
  description?: string
  breadcrumbTrail?: Array<{ label: string; href?: string }>
  crud: CrudHooks<T>
  columns: ColumnDef<T>[]
  searchKey?: string
  searchPlaceholder?: string
  formFields: FormField<T>[]
  detailFields?: DetailField<T>[]
  createButtonLabel?: string
  emptyTitle?: string
  /** Extract the entity's id — most entities use `id`, override for oddballs. */
  getId?: (row: T) => number | undefined
  /** Extra action-column at the far right (Edit + Delete) — default true. */
  showRowActions?: boolean
  /** Optional extra header actions rendered before New button. */
  extraHeaderActions?: ReactNode
  /** Optional custom detail content override (renders instead of detailFields). */
  renderDetail?: (row: T) => ReactNode
}

const getEntityId = <T extends AdminEntity>(row: T): number | undefined =>
  typeof row.id === 'number' ? row.id : undefined

export default function AdminCrudPage<T extends AdminEntity>({
  title,
  description,
  breadcrumbTrail,
  crud,
  columns,
  searchKey,
  searchPlaceholder,
  formFields,
  detailFields,
  createButtonLabel,
  emptyTitle,
  getId = getEntityId,
  showRowActions = true,
  extraHeaderActions,
  renderDetail,
}: AdminCrudPageProps<T>) {
  const listQ = crud.useList()
  const createM = crud.useCreate()
  const updateM = crud.useUpdate()
  const deleteM = crud.useDelete()

  const [detailRow, setDetailRow] = useState<T | null>(null)
  const [editingRow, setEditingRow] = useState<T | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)

  const rows = listQ.data ?? []
  const busy = createM.isPending || updateM.isPending || deleteM.isPending

  // Append actions column if enabled.
  const finalColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!showRowActions) return columns
    const actionsCol: ColumnDef<T> = {
      id: '__actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit"
            onClick={() => setEditingRow(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete"
            className="hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }
    return [...columns, actionsCol]
  }, [columns, showRowActions])

  const handleFormSubmit = async (values: Partial<T>) => {
    const isEdit = editingRow != null
    if (isEdit) {
      const id = getId(editingRow!)
      const body = { ...editingRow!, ...values, ...(id != null ? { id } : {}) } as Partial<T> & { id?: number }
      const res = await updateM.mutateAsync(body)
      if (res.ok) { toast.success(`${title} updated`); setEditingRow(null) }
      else toast.error(res.message)
    } else {
      const res = await createM.mutateAsync(values)
      if (res.ok) { toast.success(`${title} created`); setCreating(false) }
      else toast.error(res.message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const id = getId(deleteTarget)
    if (id == null) { toast.error('Missing id — cannot delete'); return }
    const res = await deleteM.mutateAsync(id)
    if (res.ok) { toast.success(`${title} deleted`); setDeleteTarget(null) }
    else toast.error(res.message)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbTrail ?? [{ label: 'Superadmin' }, { label: title }]}
        actions={
          <>
            {extraHeaderActions}
            <Button onClick={() => setCreating(true)} disabled={busy}>
              <Plus className="size-4" />
              {createButtonLabel ?? `New ${title}`}
            </Button>
          </>
        }
      />

      <DataTable<T>
        data={rows}
        columns={finalColumns}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
        loading={listQ.isLoading}
        emptyTitle={emptyTitle ?? `No ${title.toLowerCase()} yet`}
        onRowClick={(row) => setDetailRow(row)}
      />

      {/* Detail modal */}
      <Dialog open={detailRow != null} onOpenChange={(o) => !o && setDetailRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title} · Details</DialogTitle>
            <DialogDescription>Full row information</DialogDescription>
          </DialogHeader>
          {detailRow ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto themed-scrollbar pr-1">
              {renderDetail ? renderDetail(detailRow) : (
                (detailFields ?? (formFields.map((f) => ({ key: f.key, label: f.label })) as DetailField<T>[])).map((f) => {
                  const val = (detailRow as Record<string, unknown>)[f.key]
                  const fmt = (f as DetailField<T>).format
                  const rendered = typeof fmt === 'function' ? fmt(val, detailRow) : formatValue(val)
                  return (
                    <div
                      key={f.key}
                      className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[110px]">
                        {f.label}
                      </span>
                      <span className="text-sm text-right break-words">{rendered}</span>
                    </div>
                  )
                })
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setEditingRow(detailRow); setDetailRow(null) }}
            >
              <Pencil className="size-4" /> Edit
            </Button>
            <Button variant="ghost" onClick={() => setDetailRow(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit modal */}
      <CrudFormDialog<T>
        open={creating || editingRow != null}
        title={editingRow ? `Edit ${title}` : `New ${title}`}
        fields={formFields}
        initial={editingRow ?? undefined}
        busy={busy}
        onClose={() => { setCreating(false); setEditingRow(null) }}
        onSubmit={handleFormSubmit}
      />

      {/* Delete confirm */}
      <Dialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {title}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the record. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm">
              <span className="font-medium">Row:</span>{' '}
              <span className="text-muted-foreground">
                {getSummaryLabel(deleteTarget, formFields)}
              </span>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={busy}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ────────────── helpers ────────────── */

function formatValue(v: unknown): ReactNode {
  if (v == null || v === '') return <span className="text-muted-foreground italic">—</span>
  if (typeof v === 'boolean') return <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Yes' : 'No'}</Badge>
  if (typeof v === 'object') return <code className="text-[11px] whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</code>
  return String(v)
}

function getSummaryLabel<T extends AdminEntity>(row: T, fields: FormField<T>[]): string {
  const preferred = fields.find((f) => ['name', 'title', 'label', 'stateName', 'cityName', 'categoryName'].includes(f.key))
  const key = preferred?.key ?? (fields[0]?.key as string | undefined)
  if (!key) return `#${row.id ?? '?'}`
  const val = (row as Record<string, unknown>)[key]
  return typeof val === 'string' || typeof val === 'number' ? String(val) : `#${row.id ?? '?'}`
}

/* ────────────── form dialog ────────────── */

interface CrudFormDialogProps<T> {
  open: boolean
  title: string
  fields: FormField<T>[]
  initial?: T
  busy?: boolean
  onClose: () => void
  onSubmit: (values: Partial<T>) => void
}

function CrudFormDialog<T extends AdminEntity>({
  open, title, fields, initial, busy, onClose, onSubmit,
}: CrudFormDialogProps<T>) {
  const isEdit = initial != null
  const visibleFields = fields.filter((f) => (isEdit ? !f.createOnly : !f.editOnly))

  const [values, setValues] = useState<Record<string, unknown>>({})
  const [touched, setTouched] = useState(false)

  // Sync initial values whenever dialog opens or the initial row changes.
  useMemo(() => {
    if (open) {
      const seed: Record<string, unknown> = {}
      for (const f of visibleFields) {
        const initialVal = initial ? (initial as Record<string, unknown>)[f.key] : undefined
        seed[f.key] = initialVal ?? (f.kind === 'checkbox' ? false : '')
      }
      setValues(seed)
      setTouched(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  const set = (k: string, v: unknown) => {
    setTouched(true)
    setValues((prev) => ({ ...prev, [k]: v }))
  }

  const missingRequired = visibleFields.filter((f) => {
    if (!f.required) return false
    const v = values[f.key]
    return v == null || v === ''
  })

  const submit = () => {
    if (missingRequired.length > 0) return
    onSubmit(values as Partial<T>)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the fields and save.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto themed-scrollbar pr-1">
          {visibleFields.map((f) => {
            const val = values[f.key]
            const missing = touched && f.required && (val == null || val === '')
            return (
              <div key={f.key} className="space-y-1.5">
                <Label className={cn(f.required && "after:content-['*'] after:text-destructive after:ml-0.5")}>
                  {f.label}
                </Label>
                {f.kind === 'textarea' ? (
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder={f.placeholder}
                    value={String(val ?? '')}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : f.kind === 'checkbox' ? (
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={Boolean(val)}
                      onChange={(e) => set(f.key, e.target.checked)}
                    />
                    <span className="text-muted-foreground">{f.placeholder ?? 'Enable'}</span>
                  </label>
                ) : f.kind === 'select' ? (
                  <select
                    className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                    value={String(val ?? '')}
                    onChange={(e) => set(f.key, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {(f.options ?? []).map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={f.kind === 'number' ? 'number' : 'text'}
                    placeholder={f.placeholder}
                    value={String(val ?? '')}
                    onChange={(e) => set(f.key, f.kind === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                  />
                )}
                {f.helpText ? <p className="text-[11px] text-muted-foreground">{f.helpText}</p> : null}
                {missing ? <p className="text-[11px] text-destructive">Required</p> : null}
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || missingRequired.length > 0}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ────────────── helpers exported for pages that need column builders ────────────── */

/** Common column builder: a "Name / Label" text column. */
export function textColumn<T extends AdminEntity>(key: keyof T & string, header: string): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ getValue }) => <span className="font-medium">{String(getValue() ?? '—')}</span>,
  }
}

/** Common column builder: boolean → colored badge. */
export function boolColumn<T extends AdminEntity>(
  key: keyof T & string,
  header: string,
  labels: { yes: string; no: string } = { yes: 'Active', no: 'Inactive' },
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ getValue }) => {
      const v = getValue()
      const truthy = v === true || v === 1 || v === '1' || v === 'true'
      return <Badge variant={truthy ? 'success' : 'secondary'}>{truthy ? labels.yes : labels.no}</Badge>
    },
  }
}

/** Common column builder: numeric with tabular-nums. */
export function numberColumn<T extends AdminEntity>(key: keyof T & string, header: string): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ getValue }) => {
      const v = getValue()
      return <span className="tabular-nums">{v == null ? '—' : String(v)}</span>
    },
  }
}

/* Re-export MoreHorizontal for pages needing a custom actions dropdown. */
export { MoreHorizontal }

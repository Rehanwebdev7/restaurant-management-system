import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSuperadminApiLogs } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'
import type { ColumnDef } from '@tanstack/react-table'

/**
 * Read-only viewer over /api/admin/api_logs/getAll.
 * No CRUD (backend has no create/delete for api-logs — they're written by
 * the request-logging filter). Rows are inbound API request records.
 */
export default function SuperadminApiLogs() {
  const q = useSuperadminApiLogs()

  const columns: ColumnDef<AdminEntity>[] = [
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ getValue }) => {
        const m = String(getValue() ?? 'GET').toUpperCase()
        const variant = m === 'GET' ? 'secondary' : m === 'POST' ? 'info' : m === 'DELETE' ? 'destructive' : 'warning'
        return <Badge variant={variant as 'secondary' | 'info' | 'destructive' | 'warning'}>{m}</Badge>
      },
    },
    { accessorKey: 'endpoint', header: 'Endpoint', cell: ({ getValue }) => <code className="text-xs">{String(getValue() ?? '—')}</code> },
    {
      accessorKey: 'statusCode',
      header: 'Status',
      cell: ({ getValue }) => {
        const code = Number(getValue() ?? 0)
        const cls = code >= 500 ? 'text-destructive' : code >= 400 ? 'text-warning' : 'text-success'
        return <span className={cn('tabular-nums font-semibold', cls)}>{code || '—'}</span>
      },
    },
    { accessorKey: 'userName', header: 'User', cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue() ?? '—')}</span> },
    { accessorKey: 'timestamp', header: 'Time', cell: ({ getValue }) => {
      const v = getValue()
      if (!v) return '—'
      try { return new Date(String(v)).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' }) }
      catch { return String(v) }
    } },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Logs"
        description="Recent API request activity across the platform."
        breadcrumbs={[{ label: 'Superadmin' }, { label: 'Settings' }, { label: 'API Logs' }]}
        actions={
          <Button variant="outline" onClick={() => void q.refetch()}>
            <RefreshCw className={cn('size-4', q.isFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />
      <DataTable<AdminEntity>
        data={q.data ?? []}
        columns={columns}
        searchKey="endpoint"
        searchPlaceholder="Search endpoint…"
        loading={q.isLoading}
        emptyTitle="No API log entries"
      />
    </div>
  )
}

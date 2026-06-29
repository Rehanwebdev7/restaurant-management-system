import { useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Row,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Card } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

/**
 * UI-F primitive: generic DataTable on top of TanStack Table v8.
 * Replaces 703 hand-rolled react-bootstrap Table usages.
 * Features: search, sort, pagination, hover, sticky header, themed scrollbar.
 */

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  loading?: boolean
  className?: string
  onRowClick?: (row: TData) => void
}

export function DataTable<TData>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search…',
  pageSize = 10,
  emptyTitle = 'No data',
  emptyDescription,
  emptyAction,
  loading = false,
  className,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const isMobile = useIsMobile()
  // UI-F-2: on mobile + row-click → open a bottom sheet with full row detail
  // instead of letting the click handler hit a hidden-off-screen row.
  const [drawerRow, setDrawerRow] = useState<Row<TData> | null>(null)

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    initialState: { pagination: { pageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      {searchKey || true ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-9"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {data.length} rows
          </p>
        </div>
      ) : null}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto themed-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="text-left font-semibold px-4 py-3 whitespace-nowrap">
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <button
                          onClick={h.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors duration-quick"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          <ArrowUpDown className="size-3 opacity-50" />
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {table.getAllColumns().map((c) => (
                      <td key={c.id} className="px-4 py-3">
                        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      action={emptyAction}
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={
                      onRowClick
                        ? () => {
                            if (isMobile) setDrawerRow(row)
                            else onRowClick(row.original)
                          }
                        : undefined
                    }
                    className={cn(
                      'border-b border-border last:border-0 transition-all duration-quick ease-entrance',
                      onRowClick && 'cursor-pointer hover:bg-primary/5 hover:shadow-[inset_3px_0_0_hsl(var(--primary))]'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card/50">
            <p className="text-xs text-muted-foreground">
              Page{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {table.getState().pagination.pageIndex + 1}
              </span>{' '}
              of {table.getPageCount()}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* UI-F-2: Mobile row-detail bottom sheet — desktop never renders this. */}
      {onRowClick ? (
        <Drawer open={drawerRow !== null} onOpenChange={(open) => !open && setDrawerRow(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Row detail</DrawerTitle>
              <DrawerDescription>Tap "Open" to run the row action.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-2 space-y-2 max-h-[55vh] overflow-y-auto themed-scrollbar">
              {drawerRow?.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {String(cell.column.columnDef.header ?? cell.column.id)}
                  </span>
                  <span className="text-sm text-right min-w-0 break-words">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              ))}
            </div>
            <DrawerFooter>
              <Button
                onClick={() => {
                  if (drawerRow && onRowClick) {
                    onRowClick(drawerRow.original)
                    setDrawerRow(null)
                  }
                }}
              >
                Open
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  )
}

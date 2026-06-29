import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Download, TrendingUp, BarChart3, Receipt, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { DateRangeField } from '@/components/ui/date-field'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReportsShellProps {
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function ReportsShell({ title = 'Reports', breadcrumbs }: ReportsShellProps) {
  const [range, setRange] = useState<DateRange | undefined>()

  const topItems = [
    { name: 'Butter Chicken', count: 187 },
    { name: 'Paneer Tikka', count: 162 },
    { name: 'Garlic Naan', count: 340 },
    { name: 'Veg Biryani', count: 145 },
    { name: 'Mango Lassi', count: 94 },
  ]
  const max = Math.max(...topItems.map((i) => i.count))

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Revenue, orders, top items — across selectable date ranges."
        breadcrumbs={breadcrumbs}
        actions={<Button variant="outline"><Download className="size-4" /> Export PDF</Button>}
      />

      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="space-y-1.5 flex-1 max-w-sm">
            <label className="text-sm font-medium">Date range</label>
            <DateRangeField value={range} onChange={setRange} />
          </div>
          <Button variant="outline" onClick={() => setRange(undefined)}>Clear</Button>
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard hero label="Revenue" value={184_200} format={(n) => `₹${Math.round(n).toLocaleString('en-IN')}`} delta={0.21} icon={<TrendingUp className="size-5" />} />
        <StatCard label="Orders" value={312} icon={<BarChart3 className="size-5" />} />
        <StatCard label="Invoices" value={296} icon={<Receipt className="size-5" />} />
        <StatCard label="Unique customers" value={148} icon={<Users className="size-5" />} />
      </section>

      <Card>
        <CardHeader><CardTitle>Top items</CardTitle><CardDescription>Best-selling items in this range.</CardDescription></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {topItems.map((t, i) => (
              <li key={t.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">#{i + 1} {t.name}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{t.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mt-1">
                  <div className="h-full bg-primary transition-[width] duration-slow ease-entrance" style={{ width: `${(t.count / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

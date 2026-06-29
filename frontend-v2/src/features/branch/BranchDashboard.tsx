import { TrendingUp, ClipboardList, Users, ChefHat, RefreshCw, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard, StatCardSkeleton } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBranchDashboard, useBranchUsers, useBranchCustomers } from '@/api/queries/branch'

export default function BranchDashboard() {
  const dashQ = useBranchDashboard()
  const usersQ = useBranchUsers()
  const customersQ = useBranchCustomers()
  const d = dashQ.data
  const loading = dashQ.isLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Dashboard"
        description={d?.branchName ? `${d.branchName} · live` : 'Live snapshot — refreshes every 30 s.'}
        breadcrumbs={[{ label: 'Branch' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void dashQ.refetch()}>
              <RefreshCw className={dashQ.isFetching ? 'size-4 animate-spin' : 'size-4'} />
              Refresh
            </Button>
            <Button asChild><Link to="/branch/menu"><Plus className="size-4" /> Menu</Link></Button>
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton hero />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard hero label="Today revenue" value={Number(d?.todayRevenue ?? 0)} format={(n) => `₹${Math.round(n).toLocaleString('en-IN')}`} icon={<TrendingUp className="size-5" />} />
            <StatCard label="Today orders" value={d?.todayOrders ?? 0} icon={<ClipboardList className="size-5" />} />
            <StatCard label="Staff" value={usersQ.data?.length ?? 0} icon={<Users className="size-5" />} />
            <StatCard label="Customers" value={customersQ.data?.length ?? 0} icon={<ChefHat className="size-5" />} />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>By status</CardTitle><CardDescription>Live breakdown · /api/branch/dashboard/summary</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {d?.ordersByStatus && Object.keys(d.ordersByStatus).length > 0 ? (
              Object.entries(d.ordersByStatus).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{k}</Badge>
                  <span className="font-mono tabular-nums">{v}</span>
                </div>
              ))
            ) : <p className="text-xs text-muted-foreground">No order activity in this window.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" asChild><Link to="/branch/menu">Manage menu</Link></Button>
            <Button variant="outline" asChild><Link to="/branch/users">Staff</Link></Button>
            <Button variant="outline" asChild><Link to="/branch/outstanding">Outstanding</Link></Button>
            <Button variant="outline" asChild><Link to="/branch/wallet-topup">Wallet top-ups</Link></Button>
            <Button variant="outline" asChild><Link to="/branch/settings">Settings</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { TrendingUp, Users, ClipboardList, BarChart3, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrdersList } from '@/features/shared/OrdersList'
import { UsersList } from '@/features/shared/UsersList'
import { MenuManager } from '@/features/shared/MenuManager'
import { SettingsShell } from '@/features/shared/SettingsShell'
import { ReportsShell } from '@/features/shared/ReportsShell'

const crumb = (last: string) => [{ label: 'Admin', href: '/admin/dashboard' }, { label: last }]

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Tenant-wide snapshot across all branches." breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]} actions={<Button asChild><Link to="/admin/orders">View orders</Link></Button>} />
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard hero label="Revenue today" value={148200} format={(n) => `₹${Math.round(n).toLocaleString('en-IN')}`} delta={0.12} icon={<TrendingUp className="size-5" />} />
        <StatCard label="Orders" value={342} icon={<ClipboardList className="size-5" />} />
        <StatCard label="Active users" value={86} icon={<Users className="size-5" />} />
        <StatCard label="Avg ticket" value={433} format={(n) => `₹${Math.round(n)}`} icon={<BarChart3 className="size-5" />} />
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Quick links</CardTitle><CardDescription>Most-used admin destinations.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
              { to: '/admin/users', label: 'Users', icon: Users },
              { to: '/admin/products', label: 'Products', icon: ShoppingBag },
              { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
            ].map((q) => { const I = q.icon; return (
              <Link key={q.to} to={q.to} className="rounded-md border border-border bg-card hover:border-primary/40 hover:bg-primary/5 p-3 flex items-center gap-2 transition-all duration-quick ease-entrance active:scale-[0.98]">
                <span className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0"><I className="size-4" /></span>
                <span className="text-sm font-medium">{q.label}</span>
              </Link>
            )})}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>System status</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>Backend</span><span className="text-success font-medium">Healthy</span></div>
            <div className="flex items-center justify-between"><span>Stripe</span><span className="text-success font-medium">Connected</span></div>
            <div className="flex items-center justify-between"><span>Firebase FCM</span><span className="text-success font-medium">Active</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const AdminOrders = () => <OrdersList title="Orders" breadcrumbs={crumb('Orders')} />
export const AdminUsers = () => <UsersList title="Users" breadcrumbs={crumb('Users')} />
export const AdminProducts = () => <MenuManager title="Products" breadcrumbs={crumb('Products')} />
export const AdminReports = () => <ReportsShell title="Reports" breadcrumbs={crumb('Reports')} />
export const AdminSettings = () => <SettingsShell title="Settings" breadcrumbs={crumb('Settings')} />

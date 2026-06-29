import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Download, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Link } from 'react-router-dom'
import { useDeliveryWallet } from '@/api/queries/delivery'

/**
 * Delivery wallet — wired to `/api/delivery/wallet`. Falls back to a zero
 * balance + empty transactions list when the backend route is unavailable
 * rather than showing fake transactions that look like real earnings.
 */
export default function Wallet() {
  const q = useDeliveryWallet()
  const data = q.data
  const balance = Number(data?.balance ?? 0)
  const txns = data?.transactions ?? []
  const sample = !data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Your earnings, withdrawals, and balance."
        breadcrumbs={[{ label: 'Delivery', href: '/delivery/dashboard' }, { label: 'Wallet' }]}
        titleAdornment={sample && !q.isLoading ? <Badge variant="warning">Backend pending</Badge> : null}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void q.refetch()}>
              <RefreshCw className={q.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            </Button>
            <Button asChild>
              <Link to="/delivery/withdraw">
                <ArrowUpRight className="size-4" /> Withdraw
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Available balance</p>
            <p className="text-5xl font-bold tabular-nums bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              ₹{balance.toLocaleString('en-IN')}
            </p>
            {balance > 0 ? (
              <Badge variant="success" className="gap-1">
                <WalletIcon className="size-3" /> Ready to withdraw
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <WalletIcon className="size-3" /> No balance yet
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild disabled={balance <= 0}>
              <Link to="/delivery/withdraw">
                <ArrowUpRight className="size-4" /> Withdraw
              </Link>
            </Button>
            <Button variant="outline" disabled={txns.length === 0}>
              <Download className="size-4" /> Statement
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-semibold mb-3">Recent transactions</p>
          {q.isLoading ? (
            <div className="skeleton-shimmer h-32 rounded-md" />
          ) : txns.length === 0 ? (
            <EmptyState
              icon={<WalletIcon className="size-6" />}
              title="No transactions yet"
              description="Earnings from delivered orders + withdrawal requests will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {txns.map((t) => {
                const isEarning = (t.type ?? '').toLowerCase().includes('earn') || t.amount > 0
                return (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={
                          isEarning
                            ? 'size-9 rounded-full bg-success/10 text-success grid place-items-center shrink-0'
                            : 'size-9 rounded-full bg-warning/10 text-warning grid place-items-center shrink-0'
                        }
                      >
                        {isEarning ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.when}</p>
                      </div>
                    </div>
                    <p
                      className={
                        t.amount >= 0
                          ? 'text-sm font-bold tabular-nums text-success'
                          : 'text-sm font-bold tabular-nums text-foreground'
                      }
                    >
                      {t.amount >= 0 ? '+' : ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

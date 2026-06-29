import { useEffect, useState } from 'react'
import { Landmark, Plus, CheckCircle2, Trash2, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { useDeliveryBankAccounts } from '@/api/queries/delivery'
import type { DeliveryBankAccount } from '@/api/services/delivery'

export default function BankAccounts() {
  const accountsQ = useDeliveryBankAccounts()
  const [accounts, setAccounts] = useState<DeliveryBankAccount[]>([])
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<DeliveryBankAccount | null>(null)
  const [form, setForm] = useState({ bank: '', account: '', ifsc: '' })

  // Hydrate local state from the server response so optimistic add/remove can stack.
  useEffect(() => {
    if (accountsQ.data) setAccounts(accountsQ.data)
  }, [accountsQ.data])

  const submit = () => {
    if (!form.bank || !form.account || !form.ifsc) {
      toast.warning('All fields required')
      return
    }
    const next: DeliveryBankAccount = {
      id: Date.now(),
      bank: form.bank,
      account: 'XXXXXX' + form.account.slice(-4),
      ifsc: form.ifsc.toUpperCase(),
      primary: accounts.length === 0,
    }
    setAccounts([...accounts, next])
    setForm({ bank: '', account: '', ifsc: '' })
    setAdding(false)
    toast.success('Bank account added (local only — POST endpoint pending)')
  }

  const remove = (a: DeliveryBankAccount) => {
    setAccounts((prev) => prev.filter((x) => x.id !== a.id))
    toast.info(`${a.bank} removed`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Accounts"
        description="Manage where your payouts land."
        breadcrumbs={[{ label: 'Delivery', href: '/delivery/dashboard' }, { label: 'Bank Accounts' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void accountsQ.refetch()}>
              <RefreshCw className={accountsQ.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add account
            </Button>
          </>
        }
      />

      {accountsQ.isLoading ? (
        <ul className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <li key={i}>
              <Card>
                <CardContent className="pt-6">
                  <div className="skeleton-shimmer h-12 rounded-md" />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Landmark className="size-6" />}
              title="No bank accounts yet"
              description="Add an account to receive payouts."
              action={
                <Button onClick={() => setAdding(true)}>
                  <Plus className="size-4" /> Add account
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {accounts.map((a) => (
            <li key={a.id}>
              <Card interactive>
                <CardContent className="pt-6 flex items-center gap-4">
                  <span className="size-12 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Landmark className="size-6" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{a.bank}</p>
                      {a.primary ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="size-3" /> Primary
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {a.account} · {a.ifsc}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(a)} aria-label="Remove">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* Add dialog */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a bank account</DialogTitle>
            <DialogDescription>You can withdraw payouts to any account marked Primary.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bank" required>Bank name</Label>
              <Input
                id="bank"
                placeholder="e.g. HDFC Bank"
                value={form.bank}
                onChange={(e) => setForm({ ...form, bank: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account" required>Account number</Label>
              <Input
                id="account"
                inputMode="numeric"
                placeholder="Last 4 visible; full encrypted on save"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ifsc" required>IFSC</Label>
              <Input
                id="ifsc"
                placeholder="HDFC0001234"
                maxLength={11}
                value={form.ifsc}
                onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Remove ${toDelete?.bank ?? 'account'}?`}
        description="This will disable payouts to this account. You can re-add it any time."
        confirmLabel="Remove"
        onConfirm={() => { if (toDelete) remove(toDelete) }}
      />
    </div>
  )
}

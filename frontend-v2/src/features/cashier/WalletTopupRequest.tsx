import { useState } from 'react'
import { Wallet, ArrowUpRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'

export default function WalletTopupRequest() {
  const [customerMobile, setCustomerMobile] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('TOPUP')

  const valid = /^\d{10}$/.test(customerMobile) && Number(amount) > 0

  const submit = () => {
    if (!valid) {
      toast.warning('Enter valid mobile and amount')
      return
    }
    toast.success(`Topup of ₹${Number(amount).toLocaleString('en-IN')} requested for ${customerMobile}`)
    setAmount('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet Top-up"
        description="Request a wallet credit for a customer (cash deposit or in-store recharge)."
        breadcrumbs={[{ label: 'Cashier', href: '/cashier/dashboard' }, { label: 'Wallet Top-up' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New top-up</CardTitle>
            <CardDescription>Funds are credited once the request is approved by the branch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label required htmlFor="cmobile">Customer mobile</Label>
              <Input
                id="cmobile"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>
            <div className="space-y-1.5">
              <Label required htmlFor="amount">Amount (INR)</Label>
              <Input
                id="amount"
                inputMode="numeric"
                placeholder="0"
                className="h-14 text-2xl font-bold tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              />
              <div className="flex flex-wrap gap-2">
                {[100, 500, 1000, 2000].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground hover:bg-accent active:scale-[0.97] transition-all duration-quick ease-entrance"
                  >
                    ₹{p.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOPUP">Standard top-up</SelectItem>
                  <SelectItem value="REFUND">Refund credit</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!valid} onClick={submit}>
              <ArrowUpRight className="size-4" /> Submit request
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>What to tell the customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                <Wallet className="size-4" />
              </span>
              <div>
                <p className="font-semibold">Approval timing</p>
                <p className="text-xs text-muted-foreground">Usually within 15 minutes during business hours.</p>
              </div>
            </div>
            <div className="rounded-md bg-info/10 border border-info/30 p-3 text-xs">
              <Badge variant="info">Tip</Badge>
              <p className="mt-2 text-muted-foreground">
                Customers can also top up directly through the consumer app via UPI.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

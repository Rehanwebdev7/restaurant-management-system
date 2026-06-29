import { useState } from 'react'
import { ArrowUpRight, Landmark, IndianRupee } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { Link } from 'react-router-dom'

const BALANCE = 4820
const MIN = 500

const ACCOUNTS = [
  { id: '1', label: 'HDFC · XXXXXX4521' },
  { id: '2', label: 'ICICI · XXXXXX9908' },
]

export default function WithdrawalRequest() {
  const [amount, setAmount] = useState('')
  const [account, setAccount] = useState(ACCOUNTS[0]?.id ?? '')
  const numericAmount = Number(amount || 0)
  const valid =
    numericAmount >= MIN && numericAmount <= BALANCE && /^\d+$/.test(amount) && !!account

  const submit = () => {
    if (!valid) {
      toast.warning(`Enter an amount between ₹${MIN} and ₹${BALANCE}`)
      return
    }
    toast.success(`Withdrawal request for ₹${numericAmount.toLocaleString('en-IN')} submitted`)
    setAmount('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Withdraw"
        description="Request a payout to your registered bank account."
        breadcrumbs={[
          { label: 'Delivery', href: '/delivery/dashboard' },
          { label: 'Wallet', href: '/delivery/wallet' },
          { label: 'Withdraw' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Withdrawal amount</CardTitle>
            <CardDescription>
              Available balance: <span className="font-mono font-semibold">₹{BALANCE.toLocaleString('en-IN')}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount" required>Amount (INR)</Label>
              <div className="relative">
                <IndianRupee className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  inputMode="numeric"
                  placeholder={`Min ₹${MIN}`}
                  className="pl-9 text-2xl font-bold tabular-nums h-14"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum ₹{MIN.toLocaleString('en-IN')} · Maximum ₹{BALANCE.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000, BALANCE].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground hover:bg-accent active:scale-[0.97] transition-all duration-quick ease-entrance"
                >
                  {preset === BALANCE ? 'Max' : `₹${preset.toLocaleString('en-IN')}`}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account" required>Send to</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Choose a bank account" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Add a new account from{' '}
                <Link to="/delivery/bank" className="text-primary underline-offset-4 hover:underline">
                  Bank Accounts
                </Link>
                .
              </p>
            </div>

            <Button className="w-full" disabled={!valid} onClick={submit}>
              <ArrowUpRight className="size-4" /> Request withdrawal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Processing timeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                <Landmark className="size-4" />
              </span>
              <div>
                <p className="font-semibold">Within 1 business day</p>
                <p className="text-xs text-muted-foreground">IMPS for verified accounts.</p>
              </div>
            </div>
            <div className="rounded-md bg-warning/5 border border-warning/30 p-3 text-xs text-warning">
              Withdrawals during weekends process on the next business day.
            </div>
            <Badge variant="info">No fees · Powered by RMS Payouts</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

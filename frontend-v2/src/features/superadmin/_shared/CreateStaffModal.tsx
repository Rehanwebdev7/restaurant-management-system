import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { useCreateUser } from '@/api/queries/superadmin'
import type { CreateUserBody } from '@/api/services/superadmin'

type StaffRole = 'branch' | 'kitchen' | 'delivery' | 'cashier'

const ROLE_OPTIONS: Array<{ value: StaffRole; label: string; desc: string }> = [
  { value: 'branch',   label: 'Branch Manager', desc: 'Runs a specific branch — POS, staff, inventory' },
  { value: 'kitchen',  label: 'Kitchen Staff',  desc: 'Access to KDS + orders in preparation' },
  { value: 'delivery', label: 'Delivery Rider', desc: 'Assigned to delivery zones + wallet' },
  { value: 'cashier',  label: 'Cashier',        desc: 'Front-of-house POS + billing' },
]

interface Props {
  open: boolean
  onClose: () => void
  parentId: number | null                 // The restaurant this staff sits under.
  parentName?: string
  /** Restricts the role picker; when omitted, all 4 shown. */
  allowedRoles?: StaffRole[]
  /** Preselected role (skips role picker step). */
  fixedRole?: StaffRole
}

export default function CreateStaffModal({
  open, onClose, parentId, parentName, allowedRoles, fixedRole,
}: Props) {
  const create = useCreateUser()
  const [role, setRole] = useState<StaffRole>(fixedRole ?? 'branch')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setRole(fixedRole ?? 'branch')
      setName(''); setMobile(''); setEmail(''); setPassword('')
      setTouched(false)
    }
  }, [open, fixedRole])

  const visibleRoles = ROLE_OPTIONS.filter((r) => !allowedRoles || allowedRoles.includes(r.value))
  const errors: Partial<Record<'name' | 'mobile' | 'password' | 'email' | 'parent', string>> = {}
  if (!name.trim() || name.trim().length < 2) errors.name = 'Name at least 2 characters'
  if (!/^[6-9][0-9]{9}$/.test(mobile))          errors.mobile = 'Enter valid 10-digit Indian mobile'
  if (password.length < 6)                       errors.password = 'Password at least 6 characters'
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format'
  if (parentId == null)                          errors.parent = 'Parent restaurant missing'
  const canSubmit = Object.keys(errors).length === 0

  const submit = async () => {
    setTouched(true)
    if (!canSubmit) { toast.warning('Please fix highlighted fields'); return }
    const body: CreateUserBody = {
      name: name.trim(),
      mobile,
      email: email.trim() || undefined,
      password,
      role,
      parentId: parentId!,
      isActive: true,
      approvalStatus: 'APPROVED',
    }
    const res = await create.mutateAsync(body)
    if (res.ok) {
      toast.success(`${roleLabel(role)} created`)
      onClose()
    } else {
      toast.error(res.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" /> Add Staff
          </DialogTitle>
          <DialogDescription>
            {parentName ? <>Under <span className="font-semibold text-foreground">{parentName}</span></> : 'Create a new staff account'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto themed-scrollbar pr-1">
          {/* Role picker (unless fixed) */}
          {fixedRole ? (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</p>
              <p className="text-sm font-semibold mt-0.5">{roleLabel(fixedRole)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Role <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {visibleRoles.map((r) => {
                  const active = role === r.value
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`text-left p-3 rounded-md border transition-all ${
                        active
                          ? 'border-primary bg-primary/5 shadow-elevation-1'
                          : 'border-border hover:border-primary/40 hover:bg-accent'
                      }`}
                    >
                      <p className="text-sm font-semibold">{r.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <FormField label="Full Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" />
            {touched && errors.name ? <ErrText>{errors.name}</ErrText> : null}
          </FormField>

          <FormField label="Mobile" required>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
            />
            {touched && errors.mobile ? <ErrText>{errors.mobile}</ErrText> : null}
          </FormField>

          <FormField label="Email" hint="Optional but recommended">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
            {touched && errors.email ? <ErrText>{errors.email}</ErrText> : null}
          </FormField>

          <FormField label="Password" required hint="Minimum 6 characters — share securely with staff">
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a temporary password" />
            {touched && errors.password ? <ErrText>{errors.password}</ErrText> : null}
          </FormField>

          {parentId != null ? (
            <p className="text-[11px] text-muted-foreground">
              Parent restaurant: <Badge variant="outline">#{parentId} {parentName ?? ''}</Badge>
            </p>
          ) : (
            <p className="text-[11px] text-destructive">
              No parent restaurant selected — please close and pick a restaurant first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !canSubmit}>
            {create.isPending ? 'Creating…' : `Create ${roleLabel(role)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function roleLabel(r: StaffRole) {
  return ROLE_OPTIONS.find((x) => x.value === r)?.label ?? r
}

function FormField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label} {required ? <span className="text-destructive">*</span> : null}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function ErrText({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-destructive">{children}</p>
}

import { useState } from 'react'
import { Settings as SettingsIcon, Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

interface SettingsShellProps {
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
  defaultName?: string
}

export function SettingsShell({ title = 'Settings', breadcrumbs, defaultName = '' }: SettingsShellProps) {
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [dark, setDark] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Preferences, profile, and account controls."
        breadcrumbs={breadcrumbs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Update display info shown to your team.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="sname">Display name</Label><Input id="sname" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="semail">Contact email</Label><Input id="semail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button onClick={() => toast.success('Profile saved')}><Save className="size-4" /> Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Push notifications</p><p className="text-xs text-muted-foreground">New order alerts.</p></div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Dense mode</p><p className="text-xs text-muted-foreground">Compact table rows.</p></div>
              <Switch checked={dark} onCheckedChange={setDark} />
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground inline-flex items-center gap-2">
              <SettingsIcon className="size-4" /> More options coming in Phase 4 finalise.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

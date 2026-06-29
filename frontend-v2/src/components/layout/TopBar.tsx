import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Bell, User2, LogOut, Settings, Volume2, VolumeX, Globe, Check } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { BackendHealthIndicator } from '@/components/ui/backend-health-indicator'
import { tokens } from '@/lib/auth/tokens'
import { toast } from '@/lib/toast'
import { isMuted, setMuted } from '@/lib/audio/sound-manager'
import { cn } from '@/lib/utils'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

/**
 * Single TopBar replacing legacy `Header.js` (965 LOC monolith).
 * `shrink-0` keeps it from compressing when main content grows.
 * Profile dropdown with logout — clears localStorage + redirects to /login.
 * UI-F-10: sound toggle persists to localStorage `sound_muted`.
 */
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
}

export function TopBar() {
  const { resolvedTheme, setTheme } = useTheme()
  const { i18n: i18nInstance, t } = useTranslation()
  const navigate = useNavigate()
  const [muted, setMutedState] = useState(false)
  const currentLang: SupportedLanguage = (
    SUPPORTED_LANGUAGES as readonly string[]
  ).includes(i18nInstance.language)
    ? (i18nInstance.language as SupportedLanguage)
    : 'en'

  const changeLanguage = (lng: SupportedLanguage) => {
    void i18nInstance.changeLanguage(lng)
  }
  const userName = typeof window !== 'undefined' ? localStorage.getItem('UserName') : null
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('UserRole') : null

  useEffect(() => {
    setMutedState(isMuted())
  }, [])

  const toggleSound = () => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
    toast.info(next ? 'Sounds muted' : 'Sounds enabled')
  }

  const handleLogout = () => {
    tokens.clearAll()
    toast.info('Signed out')
    navigate('/login')
  }

  return (
    <header className="h-17 shrink-0 border-b border-border bg-card/70 backdrop-blur-md">
      <div className="h-full flex items-center justify-end gap-2 px-4 sm:px-6">
        <BackendHealthIndicator />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSound}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-pressed={muted}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        {/* UI-F-86: Language switcher — Globe icon → dropdown EN / HI */}
        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('common.language')}>
              <Globe className="size-5" />
            </Button>
          </DropdownMenuPrimitive.Trigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              sideOffset={8}
              align="end"
              className={cn(
                'z-50 min-w-[10rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-elevation-3',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0'
              )}
            >
              <DropdownMenuPrimitive.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('common.language')}
              </DropdownMenuPrimitive.Label>
              {SUPPORTED_LANGUAGES.map((lng) => (
                <DropdownMenuPrimitive.Item
                  key={lng}
                  onSelect={() => changeLanguage(lng)}
                  className="flex items-center justify-between gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground transition-colors duration-quick"
                >
                  <span>{LANGUAGE_LABELS[lng]}</span>
                  {currentLang === lng ? <Check className="size-4 text-primary" /> : null}
                </DropdownMenuPrimitive.Item>
              ))}
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>

        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <Button variant="outline" size="default" className="gap-2 pl-2 pr-3" aria-label="Profile menu">
              <span className="size-7 rounded-full bg-primary/15 text-primary grid place-items-center">
                <User2 className="size-4" />
              </span>
              <span className="hidden sm:inline-flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold">{userName ?? 'Guest'}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {userRole ?? 'guest'}
                </span>
              </span>
            </Button>
          </DropdownMenuPrimitive.Trigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              sideOffset={8}
              align="end"
              className={cn(
                'z-50 min-w-[12rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-elevation-3',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95'
              )}
            >
              <DropdownMenuPrimitive.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Signed in
              </DropdownMenuPrimitive.Label>
              <div className="px-2 py-1.5 border-b border-border mb-1">
                <p className="text-sm font-semibold truncate">{userName ?? 'Guest user'}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole ?? 'guest'}</p>
              </div>
              <DropdownMenuPrimitive.Item
                className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground transition-colors duration-quick"
              >
                <Settings className="size-4" /> Settings
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Item
                onSelect={handleLogout}
                className="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-destructive/10 focus:text-destructive text-destructive transition-colors duration-quick"
              >
                <LogOut className="size-4" /> Sign out
              </DropdownMenuPrimitive.Item>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>
    </header>
  )
}

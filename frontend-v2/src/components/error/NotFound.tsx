import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotFound404 } from '@/components/ui/illustrations'

/**
 * UI-F-12: 404 page with illustration + CTA.
 * UI-F-53: now uses the dedicated <NotFound404> illustration.
 */
export function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="inline-flex mx-auto text-primary">
          <NotFound404 size={180} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground text-sm">
            We couldn't find what you were looking for. The link might be broken or the page may have moved.
          </p>
        </div>
        <Button asChild>
          <Link to="/">
            Take me home <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

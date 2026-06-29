/**
 * UI-F-24: tiny SEO helper.
 * Mounts a side-effect-only "component" that updates `document.title`
 * and the `<meta name="description">` tag while the consumer is mounted.
 * Restores the previous values on unmount so SPA back-nav stays clean.
 *
 * Implemented as a hook + thin React component so callers can write JSX:
 *
 *   <DocumentTitle title="Spice Garden — Menu" description="…" />
 */

import { useEffect } from 'react'

interface DocumentTitleProps {
  title: string
  description?: string
}

function setMetaDescription(value: string): void {
  if (typeof document === 'undefined') return
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

export function useDocumentTitle(title: string, description?: string): void {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const prevTitle = document.title
    const prevDescTag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = prevDescTag?.getAttribute('content') ?? null

    document.title = title
    if (description !== undefined) setMetaDescription(description)

    return () => {
      document.title = prevTitle
      if (description !== undefined && prevDesc !== null) {
        setMetaDescription(prevDesc)
      }
    }
  }, [title, description])
}

export function DocumentTitle({ title, description }: DocumentTitleProps): null {
  useDocumentTitle(title, description)
  return null
}

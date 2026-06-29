import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'

/**
 * UI-F-89: Markdown renderer.
 * Sanitises the raw source with DOMPurify *before* parsing so that any inline
 * HTML is scrubbed of script/onhandlers. react-markdown handles the rest.
 */
interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const safe = useMemo(() => DOMPurify.sanitize(content), [content])
  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{safe}</ReactMarkdown>
    </div>
  )
}

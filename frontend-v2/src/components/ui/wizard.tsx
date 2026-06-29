import { Children, isValidElement, useState, type ReactElement, type ReactNode } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * UI-F-8: Multi-step Wizard primitive.
 * Used by signup, checkout, refund, onboarding flows.
 *
 * Children must be <WizardStep title="..." /> elements; the wizard renders
 * one step at a time, exposes Next/Back/Submit, and shows a step indicator.
 */

interface WizardStepProps {
  title: string
  description?: string
  children: ReactNode
}

export function WizardStep({ children }: WizardStepProps) {
  return <>{children}</>
}
WizardStep.displayName = 'WizardStep'

interface WizardProps {
  children: ReactNode
  onComplete?: () => void | Promise<void>
  submitLabel?: string
  className?: string
}

export function Wizard({ children, onComplete, submitLabel = 'Submit', className }: WizardProps) {
  const steps = Children.toArray(children).filter(
    (c): c is ReactElement<WizardStepProps> => isValidElement(c) && c.type === WizardStep
  )
  const [active, setActive] = useState(0)
  const [working, setWorking] = useState(false)
  const isLast = active === steps.length - 1
  const isFirst = active === 0

  const next = async () => {
    if (!isLast) {
      setActive((i) => i + 1)
      return
    }
    if (!onComplete) return
    try {
      setWorking(true)
      await onComplete()
    } finally {
      setWorking(false)
    }
  }
  const back = () => setActive((i) => Math.max(0, i - 1))

  if (steps.length === 0) return null

  return (
    <div className={cn('space-y-6', className)}>
      <ol className="flex items-center gap-2 flex-wrap">
        {steps.map((s, i) => {
          const done = i < active
          const current = i === active
          return (
            <li key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-quick',
                  done && 'bg-success/10 text-success',
                  current && 'bg-primary text-primary-foreground shadow-elevation-1',
                  !done && !current && 'bg-muted text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-5 rounded-full items-center justify-center font-bold text-[10px]',
                    done && 'bg-success text-success-foreground',
                    current && 'bg-primary-foreground/20',
                    !done && !current && 'bg-muted-foreground/20'
                  )}
                >
                  {done ? <Check className="size-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s.props.title}</span>
              </div>
              {i < steps.length - 1 ? <ChevronRight className="size-3 text-muted-foreground" /> : null}
            </li>
          )
        })}
      </ol>

      <motion.div
        key={active}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        {steps[active]?.props.title ? (
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{steps[active]?.props.title}</h3>
            {steps[active]?.props.description ? (
              <p className="text-sm text-muted-foreground">{steps[active]?.props.description}</p>
            ) : null}
          </div>
        ) : null}
        <div>{steps[active]?.props.children}</div>
      </motion.div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
        <Button variant="ghost" onClick={back} disabled={isFirst || working}>
          Back
        </Button>
        <Button onClick={next} loading={working}>
          {isLast ? submitLabel : 'Next'}
          {!isLast ? <ChevronRight className="size-4" /> : null}
        </Button>
      </div>
    </div>
  )
}

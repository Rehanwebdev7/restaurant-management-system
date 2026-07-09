import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 bg-black/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center mb-2',
        caption_label: 'text-sm font-semibold text-white',
        nav: 'space-x-1 flex items-center',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-60 hover:opacity-100 absolute left-1 text-white border-white/10 hover:bg-white/10 hover:text-white'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-60 hover:opacity-100 absolute right-1 text-white border-white/10 hover:bg-white/10 hover:text-white'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex justify-between mb-1',
        weekday: 'text-[--c-text-muted] rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-1.5 justify-between',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day_button: cn(
          'size-9 p-0 font-normal rounded-lg transition-colors flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white cursor-pointer'
        ),
        selected: 'bg-[--c-teal] text-white hover:bg-[--c-teal-deep] hover:text-white focus:bg-[--c-teal] focus:text-white font-bold',
        today: 'bg-white/15 text-white font-bold border border-white/20',
        outside: 'text-white/30 opacity-40',
        disabled: 'text-white/20 opacity-30 pointer-events-none',
        hidden: 'invisible',
        ...classNames,
      } as React.ComponentProps<typeof DayPicker>['classNames']}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="size-4 text-white" />
          }
          return <ChevronRight className="size-4 text-white" />
        },
        ...props.components
      } as React.ComponentProps<typeof DayPicker>['components']}
      {...props}
    />
  )
}

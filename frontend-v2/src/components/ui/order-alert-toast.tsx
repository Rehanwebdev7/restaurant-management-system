import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import { toast } from '@/lib/toast'
import { playSound } from '@/lib/audio/sound-manager'

/**
 * UI-F-10: Order-received toast.
 * Mount-once, fires sonner + plays alert sound. Caller controls when to mount
 * (e.g. on new order id in KDS) and unmount happens after the toast self-dismisses.
 */
interface OrderAlertToastProps {
  orderNumber: string
  customer?: string
}

export function OrderAlertToast({ orderNumber, customer }: OrderAlertToastProps) {
  useEffect(() => {
    playSound('order-received')
    toast.success(`New order ${orderNumber}`, {
      description: customer ? `From ${customer}` : 'New ticket on the line',
      icon: <Bell className="size-4" />,
      duration: 6000,
    })
  }, [orderNumber, customer])

  return null
}

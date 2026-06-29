/**
 * Order lifecycle state machine (UI-F-66).
 *
 * Models the canonical happy-path for a customer order:
 *
 *   placed → accepted → cooking → ready → out_for_delivery → delivered
 *
 * Plus a universal `CANCEL` event that can be fired from any non-terminal
 * state, transitioning to `cancelled`. The `delivered` and `cancelled`
 * states are both terminal (final) so re-firing events on a settled order
 * is a no-op.
 *
 * Why XState here:
 *   1. The lifecycle has many UI surfaces (My Orders, KDS, Cashier
 *      receipts, Delivery driver app, owner reports). All of them must
 *      agree on what events are allowed in each state — a typo on the
 *      Kitchen side that fires `OUT_FOR_DELIVERY` when the order is still
 *      `placed` shouldn't silently mutate state. The machine enforces
 *      that with a single source of truth.
 *   2. Side-effects (toast, ws emit, KOT print) can be wired through
 *      `entry` actions later without touching call sites.
 *
 * Not wired into any page yet — this file is the scaffold.
 */

import { setup, assign } from 'xstate'
import { useMachine } from '@xstate/react'

export type OrderState =
  | 'placed'
  | 'accepted'
  | 'cooking'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type OrderEvent =
  | { type: 'ACCEPT' }
  | { type: 'START_COOKING' }
  | { type: 'MARK_READY' }
  | { type: 'DISPATCH' }
  | { type: 'DELIVERED' }
  | { type: 'CANCEL'; reason?: string }

/**
 * Machine definition. We use `setup()` so the inferred event + context
 * types flow through to consumers via `useOrderMachine`.
 */
export const orderMachine = setup({
  types: {
    context: {} as { reason?: string },
    events: {} as OrderEvent,
  },
  actions: {
    persistReason: assign(({ event }) => {
      if (event.type === 'CANCEL' && event.reason) return { reason: event.reason }
      return {}
    }),
  },
}).createMachine({
  id: 'order',
  initial: 'placed',
  context: {},
  states: {
    /**
     * `placed` — customer hit "Place order"; backend has issued an
     * orderId; nobody on the restaurant side has touched it yet.
     */
    placed: {
      on: {
        ACCEPT: { target: 'accepted' },
        CANCEL: { target: 'cancelled', actions: 'persistReason' },
      },
    },
    /**
     * `accepted` — captain / cashier acknowledged. KOT printed.
     */
    accepted: {
      on: {
        START_COOKING: { target: 'cooking' },
        CANCEL: { target: 'cancelled', actions: 'persistReason' },
      },
    },
    /**
     * `cooking` — KDS chef tapped "Start". `MARK_READY` from KDS moves
     * to `ready`.
     */
    cooking: {
      on: {
        MARK_READY: { target: 'ready' },
        CANCEL: { target: 'cancelled', actions: 'persistReason' },
      },
    },
    /**
     * `ready` — sitting on the pass. For dine-in / takeaway, customer
     * collects. For delivery, dispatch hands off to a driver via
     * `DISPATCH`.
     */
    ready: {
      on: {
        DISPATCH: { target: 'out_for_delivery' },
        DELIVERED: { target: 'delivered' }, // dine-in / takeaway pickup
        CANCEL: { target: 'cancelled', actions: 'persistReason' },
      },
    },
    /**
     * `out_for_delivery` — driver picked it up. Live tracking (UI-F-94)
     * runs while we're in this state.
     */
    out_for_delivery: {
      on: {
        DELIVERED: { target: 'delivered' },
        CANCEL: { target: 'cancelled', actions: 'persistReason' },
      },
    },
    /** Terminal — settled successfully. */
    delivered: { type: 'final' },
    /** Terminal — cancelled. `context.reason` populated from CANCEL event. */
    cancelled: { type: 'final' },
  },
})

/**
 * Thin convenience hook so call sites don't have to know about
 * @xstate/react. Re-hydrates from a serialized snapshot when supplied.
 *
 *   const [state, send] = useOrderMachine('cooking')
 *   send({ type: 'MARK_READY' })
 */
export function useOrderMachine(initial?: OrderState) {
  return useMachine(
    orderMachine,
    initial ? { snapshot: orderMachine.resolveState({ value: initial, context: {} }) } : undefined,
  )
}

export default orderMachine

export type AppSurface = 'customer' | 'ops'

/** Customer booking app vs hotel/platform ops console. Set at build time. */
export const APP_SURFACE: AppSurface =
  import.meta.env.VITE_APP_SURFACE === 'ops' ? 'ops' : 'customer'

export const isOpsSurface = APP_SURFACE === 'ops'
export const isCustomerSurface = APP_SURFACE === 'customer'

/** Absolute URL of the guest app (used from ops for “guest site” links). */
export const CUSTOMER_APP_URL = String(import.meta.env.VITE_CUSTOMER_APP_URL || '').replace(/\/$/, '')

/** Absolute URL of the ops app (optional; not linked from customer builds). */
export const OPS_APP_URL = String(import.meta.env.VITE_OPS_APP_URL || '').replace(/\/$/, '')

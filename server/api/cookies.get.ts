import { getStatus } from '../utils/cookieStore'

/**
 * GET /api/cookies
 * Returns whether auth cookies are currently configured (never returns the values themselves).
 */
export default defineEventHandler(() => {
    return getStatus()
})

import { clearCookies } from '../utils/cookieStore'

export default defineEventHandler(() => {
    clearCookies()
    return { ok: true, message: 'Session cookies cleared.' }
})

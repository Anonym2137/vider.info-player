import { setCookies } from '../utils/cookieStore'

/**
 * POST /api/cookies
 * Body: { spfp: string; spol_tg: string }
 *
 * Updates the in-memory cookie store used by /api/resolve and /api/stream.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody<{ spfp?: string; spol_tg?: string }>(event)

    if (!body || (body.spfp === undefined && body.spol_tg === undefined)) {
        throw createError({ statusCode: 400, message: 'Provide spfp and/or spol_tg in the request body' })
    }

    setCookies({
        spfp: body.spfp?.trim(),
        spol_tg: body.spol_tg?.trim(),
    })

    return { ok: true, message: 'Cookies updated' }
})

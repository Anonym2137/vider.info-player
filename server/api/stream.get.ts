import { getCookies } from '../utils/cookieStore'

/**
 * GET /api/stream?url=<encoded-stream-url>
 *
 * Proxies video bytes from stream.vider.info including the auth cookies.
 * Also forwards Range headers so the browser's <video> seeking works.
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const rawUrl = query.url as string | undefined

    if (!rawUrl) {
        throw createError({ statusCode: 400, message: 'Missing url query param' })
    }

    let targetUrl: string
    try {
        targetUrl = decodeURIComponent(rawUrl)
    } catch {
        throw createError({ statusCode: 400, message: 'Invalid url encoding' })
    }

    if (!targetUrl.includes('stream.vider.info') && !targetUrl.includes('vider.info')) {
        throw createError({ statusCode: 403, message: 'Only vider.info stream URLs are allowed' })
    }

    const cookieHeader = await getCookies()

    // Forward Range header from client for seeking support
    const rangeHeader = getHeader(event, 'range')
    const reqHeaders: Record<string, string> = {
        'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Referer: 'https://vider.info/',
    }
    if (cookieHeader) reqHeaders['Cookie'] = cookieHeader
    if (rangeHeader) reqHeaders['Range'] = rangeHeader

    let response: Response
    try {
        response = await fetch(targetUrl, { headers: reqHeaders })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        throw createError({ statusCode: 502, message: `Stream fetch failed: ${message}` })
    }

    if (!response.ok) {
        throw createError({
            statusCode: 502,
            message: `Stream server returned HTTP ${response.status}. Your cookies may be expired — re-enter them in Settings.`,
        })
    }

    // Forward relevant response headers
    const headersToForward = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'last-modified',
        'etag',
    ]

    setResponseStatus(event, response.status)

    for (const header of headersToForward) {
        const val = response.headers.get(header)
        if (val) setHeader(event, header, val)
    }

    // Allow browser to cache
    setHeader(event, 'cache-control', 'public, max-age=3600')

    // Stream the body to the client
    if (!response.body) {
        throw createError({ statusCode: 502, message: 'Empty response from stream server' })
    }

    return sendStream(event, response.body as unknown as ReadableStream)
})

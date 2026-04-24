import { defineEventHandler, getHeader, setHeader, sendStream, createError, setResponseStatus } from 'h3'
import { getCookies } from '../utils/cookieStore'

export default defineEventHandler(async (event) => {
    const rawUrl = 'https://stream.vider.info/video/500392/v.mp4?uid=0'

    const cookieHeader = getCookies()

    const rangeHeader = getHeader(event, 'range')
    const reqHeaders: Record<string, string> = {
        Cookie: cookieHeader,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Referer: 'https://vider.info/',
    }
    if (rangeHeader) reqHeaders['Range'] = rangeHeader

    let response: Response
    try {
        response = await fetch(rawUrl, { headers: reqHeaders })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        throw createError({ statusCode: 502, message: `Stream fetch failed: ${message}` })
    }

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

    setHeader(event, 'cache-control', 'public, max-age=3600')

    if (!response.body) {
        throw createError({ statusCode: 502, message: 'Empty response' })
    }

    return sendStream(event, response.body as unknown as ReadableStream)
})

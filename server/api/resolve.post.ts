import { getCookies } from '../utils/cookieStore'

/**
 * POST /api/resolve
 * Body: { url: string }  — a vider.info URL (page or embed)
 *
 * Fetches the vider.info video page with auth cookies, extracts
 * the real stream URL from the page HTML, and returns it.
 */
export default defineEventHandler(async (event) => {
    const { url } = await readBody<{ url: string }>(event)

    if (!url || !url.includes('vider.info')) {
        throw createError({ statusCode: 400, message: 'Not a valid vider.info URL' })
    }

    const cookieHeader = getCookies()

    let html: string
    try {
        html = await $fetch<string>(url, {
            responseType: 'text',
            headers: {
                Cookie: cookieHeader,
                'User-Agent':
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                Referer: 'https://vider.info/',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
            },
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        throw createError({ statusCode: 502, message: `Failed to fetch vider.info page: ${message}` })
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Extract the stream URL from various possible page formats:
    //
    //  1. JWPlayer config:        file: "https://stream.vider.info/video/123/v.mp4?uid=0"
    //  2. HTML5 <source>:         <source src="https://stream.vider.info/...">
    //  3. Bare MP4 reference:     https://stream.vider.info/video/123/v.mp4...
    //  4. JSON-encoded:          \"file\":\"https://stream.vider.info/...\"
    // ─────────────────────────────────────────────────────────────────────────────
    const patterns = [
        // file: "..." or file:"..."
        /['":]file["'\s]*[:=]\s*["'`](https?:\/\/stream\.vider\.info\/[^"'`\s]+)/i,
        // src: "..."
        /src\s*:\s*["'](https?:\/\/stream\.vider\.info\/[^"'\s]+)/i,
        // <source src="...">
        /<source[^>]+src=["'](https?:\/\/stream\.vider\.info\/[^"']+)/i,
        // JSON-escaped
        /\\?"file\\?":\s*\\?"(https?:\\?\/\\?\/stream\.vider\.info\\?\/[^"\\]+)\\?"/i,
        // bare URL anywhere
        /(https?:\/\/stream\.vider\.info\/video\/[^"'\s<>]+\.mp4[^"'\s<>]*)/i,
    ]

    let streamUrl: string | null = null
    for (const pattern of patterns) {
        const m = html.match(pattern)
        if (m?.[1]) {
            // Unescape JSON-escaped slashes
            streamUrl = m[1].replace(/\\\/\//g, '//').replace(/\\\//g, '/')
            break
        }
    }

    // Also extract the embed URL if present
    const embedMatch = html.match(/vider\.info\/embed\/([a-zA-Z0-9_+\-]+)/i)
    const embedUrl = embedMatch?.[1] ? `https://vider.info/embed/${embedMatch[1]}` : null

    // Extract title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch?.[1] ? titleMatch[1].replace(' – Vider', '').replace(' - Vider', '').trim() : ''

    return {
        streamUrl,   // direct MP4 – null if not found
        embedUrl,    // vider.info embed fallback
        title,
        cookiesConfigured: !!cookieHeader,
    }
})

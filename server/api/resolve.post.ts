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

    // Ensure absolute URL — user might paste without https://
    const targetUrl = url.startsWith('http') ? url : `https://${url}`

    const cookieHeader = getCookies()

    // Use native fetch so non-2xx responses don't throw — we still want the body.
    // Do NOT set Accept-Encoding manually; Node/undici decompresses automatically.
    let response: Response
    try {
        response = await fetch(targetUrl, {
            headers: {
                Cookie: cookieHeader,
                'User-Agent':
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                Referer: 'https://vider.info/',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
                'Upgrade-Insecure-Requests': '1',
            },
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        throw createError({ statusCode: 502, message: `Network error fetching vider.info page: ${message}` })
    }

    // Read body regardless of status so we can attempt extraction even on soft-errors
    let html: string
    try {
        html = await response.text()
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        throw createError({ statusCode: 502, message: `Failed to read vider.info response body: ${message}` })
    }


    if (!response.ok && html.length < 500) {
        // Short error body — the upstream actually rejected us
        throw createError({
            statusCode: 502,
            message: `vider.info returned HTTP ${response.status} ${response.statusText}. Check that your cookies are valid.`,
        })
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Extract the stream URL from the HTML.
    //
    // The page contains TWO different video IDs in separate tags:
    //   - <link rel="video_src"> — LEGACY / WRONG (old Flash fallback, different ID)
    //   - <link itemprop="embedURL"> — CORRECT (what JWPlayer / <video> actually uses)
    //   - JSON-LD "embedUrl"        — CORRECT (same URL as embedURL)
    //
    // The value after `file=` in the embedURL/JSON-LD is the correct stream URL.
    // Priority: structured metadata first → generic ?file= last (to avoid video_src).
    // ─────────────────────────────────────────────────────────────────────────────
    const patterns = [
        // #1 — <link itemprop="embedURL" href="...player.swf?file=STREAM_URL">
        // This is the canonical embed metadata and always has the correct video ID
        /<link[^>]+itemprop=["']embedURL["'][^>]+href=["'][^"']*?[?&]file=(https?:\/\/stream\.vider\.info\/[^"'&\s]+)/i,
        // #2 — JSON-LD "embedUrl": "...player.swf?file=STREAM_URL"
        /"embedUrl"\s*:\s*"[^"]*?[?&]file=(https?:\/\/stream\.vider\.info\/[^"\\]+)/i,
        // #3 — plain jwplayer setup file property (future-proofing)
        /jwplayer[^;]{0,800}file\s*:\s*["'`](https?:\/\/stream\.vider\.info\/[^"'`\s]+)/i,
        // #4 — <source src="...">
        /<source[^>]+src=["'](https?:\/\/stream\.vider\.info\/[^"']+)/i,
        // #5 — generic ?file= (excludes video_src relation to skip the legacy tag)
        /<link(?![^>]*rel=["']video_src["'])[^>]*[?&]file=(https?:\/\/stream\.vider\.info\/[^"'&\s<>]+)/i,
        // #6 — bare .mp4 URL anywhere (last resort)
        /(https?:\/\/stream\.vider\.info\/video\/[^"'\s<>]+\.mp4[^"'\s<>]*)/i,
    ]

    let streamUrl: string | null = null
    for (const pattern of patterns) {
        const m = html.match(pattern)
        if (m?.[1]) {
            // Unescape JSON-escaped slashes
            streamUrl = m[1].replace(/\\\\/g, '').replace(/\\\//g, '/')
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
        upstreamStatus: response.status,
    }
})

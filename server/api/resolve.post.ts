import { getCookies, parseAndSaveSetCookie } from '../utils/cookieStore'
import { JSDOM } from 'jsdom'
import fs from 'fs'

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

    const cookieHeader = await getCookies()

    // Use native fetch so non-2xx responses don't throw — we still want the body.
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

    // Automatically parse and save any cookies returned by vider.info
    const setCookies = response.headers.getSetCookie?.() || []
    if (setCookies.length > 0) {
        parseAndSaveSetCookie(setCookies)
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
        throw createError({
            statusCode: 502,
            message: `vider.info returned HTTP ${response.status} ${response.statusText}. Check that your cookies are valid.`,
        })
    }

    const dom = new JSDOM(html)
    const document = dom.window.document

    let fileUrl = document.querySelector('link[rel="video_src"]')?.getAttribute("href")
    const fileId = fileUrl?.match(/\/video\/([\d,]+)\//)?.[1]?.replace(',', '.');
    let streamUrl = null
    if (fileId) {
        streamUrl = `https://stream.vider.info/video/${parseFloat(fileId) * 5}/v.mp4?uid=0`
    }

    // Also extract the embed URL if present
    const embedId = document.querySelector("#file-download")?.getAttribute("data-file-id") || null
    const embedUrl = fileId ? `https://vider.pl/embed/video/${fileId}` : null;

    // Extract title from <title> tag
    const title = (document.querySelector('title')?.textContent ?? '')
        .replace(' – Vider', '').replace(' - Vider', '')
        .replace(' - Video w Vider.info', '').replace(' – Video w Vider.info', '')
        .trim();

    const hostUrl = getRequestURL(event).origin;

    return {
        streamUrl,
        embedUrl,
        title,
        upstreamStatus: response.status,
        html: `<base href="https://vider.info/">\n` + html
            .replace(/ca-pt-cha\.png(\?[0-9a-zA-Z&_=]*)?/gi, `ca-pt-cha.png?_cb=${Date.now()}`)
            .replace(/<form method="post"[^>]*>/i, `<form method="post" action="${hostUrl}/api/captcha">\n<input type="hidden" name="targetUrl" value="${targetUrl}">`),
    }
})

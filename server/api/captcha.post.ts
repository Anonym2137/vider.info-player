import { getCookies, parseAndSaveSetCookie } from '../utils/cookieStore'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const captcha = body.captcha
    const targetUrl = body.targetUrl

    if (!captcha || !targetUrl) {
        return "Missing captcha or targetUrl"
    }

    const cookieHeader = await getCookies()

    const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookieHeader,
            'Referer': targetUrl,
        },
        body: new URLSearchParams({ captcha }).toString(),
        redirect: 'manual'
    })

    const setCookieHeader = response.headers.getSetCookie()
    if (setCookieHeader && setCookieHeader.length > 0) {
        parseAndSaveSetCookie(setCookieHeader)
    }

    // Return a script to notify our top-level Vue player that we resolved the proxy!
    return `
        <!DOCTYPE html>
        <html><head></head><body style="background: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
        <div>Verifying...</div>
        <script>
            window.parent.postMessage({ type: 'CAPTCHA_SOLVED' }, '*');
        </script>
        </body></html>
    `
})

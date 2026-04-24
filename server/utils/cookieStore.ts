/**
 * Server-side in-memory cookie store for vider.info auth cookies.
 * Both resolve and stream routes share this singleton.
 */

interface CookieStore {
    [key: string]: string
}

// Global singleton persists for the lifetime of the Nitro process
const store: CookieStore = {}

export async function getCookies(): Promise<string> {
    // If we have no cookies, fetch the main page to initialize a session
    if (Object.keys(store).length === 0) {
        try {
            const response = await fetch('https://vider.info/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Upgrade-Insecure-Requests': '1',
                }
            })
            const setCookies = response.headers.getSetCookie?.() || []
            if (setCookies.length > 0) {
                parseAndSaveSetCookie(setCookies)
            }
        } catch (e) {
            console.error('[cookieStore] Failed to pre-fetch cookies from vider.info:', e)
        }
    }

    return Object.entries(store)
        .map(([key, val]) => `${key}=${val}`)
        .join('; ')
}

/**
 * Parses an array of Set-Cookie header strings and saves them to the store.
 */
export function parseAndSaveSetCookie(setCookieHeaders: string[]) {
    for (const header of setCookieHeaders) {
        // e.g., "spfp=12345; path=/; HttpOnly"
        const primary = header.split(';')[0] // "spfp=12345"
        if (primary && primary.includes('=')) {
            const [key, ...valParts] = primary.split('=')
            const val = valParts.join('=')
            if (key) {
                store[key.trim()] = val.trim()
            }
        }
    }
}

export function clearCookies() {
    for (const key of Object.keys(store)) {
        delete store[key]
    }
}

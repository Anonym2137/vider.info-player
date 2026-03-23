/**
 * Server-side in-memory cookie store for vider.info auth cookies.
 * Both resolve and stream routes share this singleton.
 */

interface CookieStore {
    spfp: string
    spol_tg: string
}

// Global singleton persists for the lifetime of the Nitro process
const store: CookieStore = {
    spfp: '',
    spol_tg: '',
}

export function getCookies(): string {
    const parts: string[] = []
    if (store.spfp) parts.push(`spfp=${store.spfp}`)
    if (store.spol_tg) parts.push(`spol_tg=${store.spol_tg}`)
    return parts.join('; ')
}

export function setCookies(data: Partial<CookieStore>) {
    if (data.spfp !== undefined) store.spfp = data.spfp
    if (data.spol_tg !== undefined) store.spol_tg = data.spol_tg
}

export function getStatus(): { configured: boolean; spfpSet: boolean; spol_tgSet: boolean } {
    return {
        configured: !!(store.spfp && store.spol_tg),
        spfpSet: !!store.spfp,
        spol_tgSet: !!store.spol_tg,
    }
}

/**
 * useViderPlayer composable
 *
 * Parses vider.info URLs into canonical embed URLs and
 * manages a persistent watchlist via localStorage.
 */

export interface ViderVideo {
    id: string
    title: string
    embedUrl: string
    originalUrl: string
    addedAt: number
    thumbnail?: string
}

/**
 * Converts any vider.info URL variant into the embed iframe src.
 *
 * Supported formats:
 *   https://vider.info/video/abc123
 *   https://vider.info/embed/abc123
 *   https://vider.info/v/abc123
 *   https://vider.info/abc123
 *   embed iframe src directly
 */
export function parseViderUrl(input: string): { embedUrl: string; videoId: string } | null {
    if (!input || typeof input !== 'string') return null

    const raw = input.trim()

    // ── Already a vider.info embed URL ──────────────────────────────────────────
    const embedMatch = raw.match(/vider\.info\/vid\/([a-zA-Z0-9_+\-]+)/i)
    //console.log(`https://vider.info/embed/video/${embedMatch}`)
    if (embedMatch?.[1]) {
        return {
            videoId: embedMatch[1],
            embedUrl: `https://vider.info/embed/video/${embedMatch[1].slice(2)}`,
        }
    }

    // ── Vider.info video page URLs ───────────────────────────────────────────────
    // https://vider.info/video/<id>
    // https://vider.info/v/<id>
    const pageMatch = raw.match(/vider\.info\/(?:video|v)\/([a-zA-Z0-9_-]+)/)
    if (pageMatch?.[1]) {
        return {
            videoId: pageMatch[1],
            embedUrl: `https://vider.info/embed/${pageMatch[1]}`,
        }
    }

    // ── Bare vider.info/<id> ─────────────────────────────────────────────────────
    const bareMatch = raw.match(/^https?:\/\/vider\.info\/([a-zA-Z0-9_+\-]{4,})$/)
    if (bareMatch?.[1]) {
        return {
            videoId: bareMatch[1],
            embedUrl: `https://vider.info/embed/${bareMatch[1]}`,
        }
    }

    // ── iframe src extract ───────────────────────────────────────────────────────
    const iframeMatch = raw.match(/src=["']([^"']*vider\.info[^"']*)["']/)
    if (iframeMatch?.[1]) {
        return parseViderUrl(iframeMatch[1])
    }

    return null
}

export function useViderPlayer() {
    const watchlist = useState<ViderVideo[]>('watchlist', () => [])

    // ── Load from localStorage ───────────────────────────────────────────────────
    if (import.meta.client) {
        const stored = localStorage.getItem('vider-watchlist')
        if (stored) {
            try {
                watchlist.value = JSON.parse(stored)
            } catch { }
        }
    }

    // ── Persist to localStorage ──────────────────────────────────────────────────
    watch(
        watchlist,
        (val) => {
            if (import.meta.client) {
                localStorage.setItem('vider-watchlist', JSON.stringify(val))
            }
        },
        { deep: true },
    )

    function addVideo(originalUrl: string, title = '') {
        const parsed = parseViderUrl(originalUrl)
        if (!parsed) return null

        // Avoid duplicates
        if (watchlist.value.find((v) => v.id === parsed.videoId)) {
            return watchlist.value.find((v) => v.id === parsed.videoId)!
        }

        const video: ViderVideo = {
            id: parsed.videoId,
            title: title || `Video ${parsed.videoId.slice(0, 8)}`,
            embedUrl: parsed.embedUrl,
            originalUrl,
            addedAt: Date.now(),
        }

        watchlist.value = [video, ...watchlist.value]
        return video
    }

    function removeVideo(id: string) {
        watchlist.value = watchlist.value.filter((v) => v.id !== id)
    }

    function clearWatchlist() {
        watchlist.value = []
    }

    function updateTitle(id: string, title: string) {
        const video = watchlist.value.find((v) => v.id === id)
        if (video) video.title = title
    }

    return {
        watchlist: readonly(watchlist),
        addVideo,
        removeVideo,
        clearWatchlist,
        updateTitle,
        parseViderUrl,
    }
}

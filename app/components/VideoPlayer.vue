<template>
  <div class="player-wrapper" :class="{ 'player-wrapper--fullscreen': isFullscreen }">

    <!-- Toolbar -->
    <div class="player-toolbar">
      <div class="toolbar-left">
        <div class="player-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/>
          </svg>
        </div>
        <div class="player-meta">
          <span v-if="isEditing" class="title-edit-wrap">
            <input
              ref="titleInputEl"
              v-model="editTitle"
              class="title-edit"
              @blur="saveTitle"
              @keydown.enter="saveTitle"
              @keydown.escape="isEditing = false"
            />
          </span>
          <span v-else class="player-title" :title="currentTitle" @click="startEditing">
            {{ currentTitle }}
          </span>
          <span class="player-url">{{ activeUrl }}</span>
        </div>
      </div>

      <div class="toolbar-right">
        <!-- Stream mode badge -->
        <span class="mode-badge" :class="html && !useNativePlayer && !embedUrl ? 'mode-badge--captcha' : useNativePlayer ? 'mode-badge--stream' : 'mode-badge--embed'">
          {{ html && !useNativePlayer && !embedUrl ? '🔒 Captcha' : useNativePlayer ? '▶ Direct Stream' : '◻ Embed' }}
        </span>

        <!-- Reset Captcha Session Button -->
        <button
          v-if="html && !useNativePlayer && !embedUrl"
          class="tool-btn reset-btn"
          title="Delete current session and fetch a new one instantly"
          @click="resetSession"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset Session
        </button>

        <!-- Toggle between native / embed if both available -->
        <button
          v-if="proxyUrl && embedUrl"
          class="tool-btn"
          :title="useNativePlayer ? 'Switch to embed mode' : 'Switch to direct stream'"
          @click="useNativePlayer = !useNativePlayer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        </button>

        <button class="tool-btn" title="Edit title" @click="startEditing">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="tool-btn" title="Open original page" @click="openExternal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
        <button class="tool-btn" :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'" @click="toggleFullscreen">
          <svg v-if="!isFullscreen" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
          </svg>
        </button>
        <button class="tool-btn tool-btn--danger" title="Close player" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Video area -->
    <div class="video-area">

      <!-- Video.js player (direct stream via proxy) -->
      <template v-if="useNativePlayer && proxyUrl">
        <div ref="vjsContainerEl" class="vjs-container">
          <video
            ref="videoEl"
            class="video-js vjs-big-play-centered vjs-theme-vider"
          />
        </div>
        <div v-if="loading" class="video-loading">
          <div class="loading-spinner"/>
          <span>Loading stream…</span>
        </div>
        <div v-if="videoError" class="video-error">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{{ videoError }}</p>
          <button v-if="embedUrl" class="btn btn-ghost retry-btn" @click="useNativePlayer = false">
            Try embed mode instead
          </button>
        </div>
      </template>

      <!-- Iframe embed fallback -->
      <template v-else-if="embedUrl">
        <div v-if="loading" class="video-loading">
          <div class="loading-spinner"/>
          <span>Loading embed…</span>
        </div>
        <iframe
          :src="embedUrl"
          :title="currentTitle"
          allowfullscreen
          allow="autoplay; fullscreen; picture-in-picture"
          scrolling="no"
          frameborder="0"
          class="player-iframe"
          @load="loading = false"
        />
      </template>

      <!-- HTML Captcha / Fallback -->
      <template v-else-if="html">
        <iframe
          :srcdoc="html"
          title="vider.info Captcha"
          sandbox="allow-scripts allow-same-origin allow-forms"
          class="player-iframe captcha-iframe"
          frameborder="0"
          scrolling="yes"
        />
      </template>

      <!-- Nothing available -->
      <div v-else class="video-loading">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>No playable source available.</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="player-footer">
      <button class="btn btn-ghost save-btn" :class="{ 'save-btn--saved': isSaved }" @click="toggleSave">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            :fill="isSaved ? 'currentColor' : 'none'"
          />
        </svg>
        {{ isSaved ? 'Saved to Watchlist' : 'Save to Watchlist' }}
      </button>
      <span class="player-source">vider.info</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import 'video.js/dist/video-js.css'

interface Props {
  /** Proxy URL to our /api/stream endpoint — preferred playback method */
  proxyUrl: string | null
  /** Direct stream URL on stream.vider.info (for reference/display) */
  streamUrl: string | null
  /** Embed iframe URL (fallback) */
  embedUrl: string | null
  html?: string | null
  videoId: string
  originalUrl: string
  initialTitle?: string
}

const props = withDefaults(defineProps<Props>(), { initialTitle: '' })
const emit = defineEmits<{ close: [], retry: [url: string] }>()

const { addVideo, removeVideo, watchlist, updateTitle } = useViderPlayer()

// ── State ──────────────────────────────────────────────────────────────────────
const loading       = ref(true)
const isFullscreen  = ref(false)
const isEditing     = ref(false)
const videoError    = ref('')
const titleInputEl  = ref<HTMLInputElement | null>(null)
const videoEl       = ref<HTMLVideoElement | null>(null)
const vjsContainerEl = ref<HTMLDivElement | null>(null)

let vjsPlayer: Player | null = null

// Prefer native player when a proxy URL exists
const useNativePlayer = ref(!!props.proxyUrl)

const currentTitle = ref(
  watchlist.value.find((v) => v.id === props.videoId)?.title
    || props.initialTitle
    || `Video ${props.videoId.slice(0, 8)}`,
)
const editTitle = ref(currentTitle.value)

// ── Computed ───────────────────────────────────────────────────────────────────
const isSaved = computed(() => watchlist.value.some((v) => v.id === props.videoId))

const activeUrl = computed(() =>
  useNativePlayer.value && props.streamUrl
    ? props.streamUrl.replace('https://stream.vider.info', 'stream.vider.info')
    : props.embedUrl
      ? props.embedUrl.replace('https://vider.info', 'vider.info')
      : props.html ? 'vider.info challenge' : ''
)

// ── Skip helpers ───────────────────────────────────────────────────────────────
const SKIP_SECONDS = 15

function skip(delta: number) {
  if (!vjsPlayer) return
  const cur = vjsPlayer.currentTime() as number
  const dur = vjsPlayer.duration() as number
  vjsPlayer.currentTime(Math.max(0, Math.min(cur + delta, dur)))
}

function onKeydown(e: KeyboardEvent) {
  if (!vjsPlayer || !useNativePlayer.value) return
  // Ignore when typing in inputs
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    skip(SKIP_SECONDS)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    skip(-SKIP_SECONDS)
  }
}

// ── Video.js lifecycle ─────────────────────────────────────────────────────────
function initVideoJs() {
  if (!videoEl.value || vjsPlayer) return

  vjsPlayer = videojs(videoEl.value, {
    controls: true,
    autoplay: false,
    preload: 'auto',
    fluid: true,
    responsive: true,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    controlBar: {
      children: [
        'playToggle',
        'volumePanel',
        'currentTimeDisplay',
        'timeDivider',
        'durationDisplay',
        'progressControl',
        'playbackRateMenuButton',
        'pictureInPictureToggle',
        'fullscreenToggle',
      ],
    },
    sources: props.proxyUrl ? [{ src: props.proxyUrl, type: 'video/mp4' }] : [],
  })

  // Inject skip buttons into the control bar after playToggle
  const controlBar = (vjsPlayer as any).controlBar
  if (controlBar) {
    const Button = videojs.getComponent('Button') as any

    // Skip backward button
    const skipBackBtn = new Button(vjsPlayer, {
      clickHandler: () => skip(-SKIP_SECONDS),
    })
    skipBackBtn.addClass('vjs-skip-backward')
    skipBackBtn.controlText(`Skip back ${SKIP_SECONDS}s`)
    const bgIcon = document.createElement('span')
    bgIcon.className = 'vjs-skip-icon'
    bgIcon.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12.5 3C7.81 3 4 6.81 4 11.5H1l4 4 4-4H6c0-3.58 2.92-6.5 6.5-6.5s6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5c-1.56 0-2.99-.55-4.11-1.47l-1.41 1.41C8.82 19.36 10.58 20 12.5 20c4.69 0 8.5-3.81 8.5-8.5S17.19 3 12.5 3z"/>
          <text x="12.5" y="14.5" text-anchor="middle" font-size="7" font-weight="bold" fill="currentColor">${SKIP_SECONDS}</text>
        </svg>`
    skipBackBtn.el().appendChild(bgIcon)
    controlBar.addChild(skipBackBtn, {}, 1) // after playToggle (index 0)

    // Skip forward button
    const skipFwdBtn = new Button(vjsPlayer, {
      clickHandler: () => skip(SKIP_SECONDS),
    })
    skipFwdBtn.addClass('vjs-skip-forward')
    skipFwdBtn.controlText(`Skip forward ${SKIP_SECONDS}s`)
    const fgIcon = document.createElement('span')
    fgIcon.className = 'vjs-skip-icon'
    fgIcon.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M11.5 3C16.19 3 20 6.81 20 11.5H23l-4 4-4-4h3c0-3.58-2.92-6.5-6.5-6.5S5 7.92 5 11.5 7.92 18 11.5 18c1.56 0 2.99-.55 4.11-1.47l1.41 1.41C15.18 19.36 13.42 20 11.5 20 6.81 20 3 16.19 3 11.5S6.81 3 11.5 3z"/>
          <text x="11.5" y="14.5" text-anchor="middle" font-size="7" font-weight="bold" fill="currentColor">${SKIP_SECONDS}</text>
        </svg>`
    skipFwdBtn.el().appendChild(fgIcon)
    controlBar.addChild(skipFwdBtn, {}, 2) // after skipBackBtn
  }

  vjsPlayer.on('loadedmetadata', () => {
    loading.value = false
  })

  vjsPlayer.on('error', () => {
    loading.value = false
    videoError.value = 'Could not load the stream. Your cookies may be expired or the video is restricted. Try embed mode.'
  })
}

function disposeVideoJs() {
  if (vjsPlayer) {
    vjsPlayer.dispose()
    vjsPlayer = null
  }
}

async function resetSession() {
  await $fetch('/api/cookies', { method: 'DELETE' })
  emit('close')
}

function handleMessage(e: MessageEvent) {
  console.log(e.data)
  if (e.data?.type === 'CAPTCHA_SOLVED') {
    emit('retry', props.originalUrl)
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  window.addEventListener('keydown', onKeydown)
  if (useNativePlayer.value && props.proxyUrl) {
    nextTick(initVideoJs)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('keydown', onKeydown)
  disposeVideoJs()
})

// ── Watchers ───────────────────────────────────────────────────────────────────
watch([() => props.proxyUrl, () => props.embedUrl], () => {
  loading.value = true
  videoError.value = ''
  disposeVideoJs()
  useNativePlayer.value = !!props.proxyUrl
  if (useNativePlayer.value && props.proxyUrl) {
    nextTick(initVideoJs)
  }
})

watch(useNativePlayer, (native) => {
  loading.value = true
  videoError.value = ''
  if (native && props.proxyUrl) {
    nextTick(initVideoJs)
  } else {
    disposeVideoJs()
  }
})

// ── Methods ────────────────────────────────────────────────────────────────────
function toggleSave() {
  if (isSaved.value) {
    removeVideo(props.videoId)
  } else {
    addVideo(props.originalUrl, currentTitle.value)
  }
}

function openExternal() {
  window.open(props.originalUrl, '_blank', 'noopener,noreferrer')
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function startEditing() {
  editTitle.value = currentTitle.value
  isEditing.value = true
  nextTick(() => titleInputEl.value?.focus())
}

function saveTitle() {
  if (editTitle.value.trim()) {
    currentTitle.value = editTitle.value.trim()
    if (isSaved.value) updateTitle(props.videoId, currentTitle.value)
  }
  isEditing.value = false
}
</script>

<style scoped>
.player-wrapper {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card), var(--shadow-glow);
  animation: fadeInUp 0.35s ease both;
}

.player-wrapper--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  border-radius: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Toolbar ── */
.player-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  gap: 12px;
  min-height: 56px;
  flex-wrap: wrap;
}

.toolbar-left  { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.toolbar-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.player-icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}

.player-meta { display: flex; flex-direction: column; min-width: 0; }

.player-title {
  font-size: 14px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  cursor: pointer; transition: color var(--transition);
}
.player-title:hover { color: var(--accent-purple); }

.player-url {
  font-size: 11px; color: var(--text-muted);
  font-family: monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.title-edit-wrap { display: flex; }
.title-edit {
  background: var(--bg-primary); border: 1px solid var(--accent-purple);
  border-radius: 6px; color: var(--text-primary);
  font-size: 14px; font-weight: 600; padding: 3px 8px;
  outline: none; width: 240px; font-family: 'Inter', sans-serif;
}

/* Mode badge */
.mode-badge {
  font-size: 11px; font-weight: 600;
  padding: 3px 9px; border-radius: 12px;
  white-space: nowrap;
}
.mode-badge--stream {
  background: rgba(34,197,94,0.12);
  color: #22c55e;
  border: 1px solid rgba(34,197,94,0.25);
}
.mode-badge--embed {
  background: rgba(59,130,246,0.12);
  color: #3b82f6;
  border: 1px solid rgba(59,130,246,0.25);
}
.mode-badge--captcha {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.reset-btn {
  width: auto;
  padding: 0 10px;
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
  font-size: 12px;
  font-weight: 600;
  gap: 6px;
  display: flex;
}
.reset-btn:hover {
  background: rgba(239, 68, 68, 0.25);
}

.tool-btn {
  width: 32px; height: 32px; border-radius: 8px;
  background: transparent; border: 1px solid transparent;
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
}
.tool-btn:hover { background: var(--bg-card); border-color: var(--border-subtle); color: var(--text-primary); }
.tool-btn--danger:hover { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: #ef4444; }

/* ── Video area ── */
.video-area {
  position: relative;
  background: #000;
}

.player-wrapper--fullscreen .video-area {
  flex: 1;
}

/* Video.js container */
.vjs-container {
  width: 100%;
}

.player-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}

/* For iframe modes, keep 16:9 aspect via padding trick */
.video-area:has(.player-iframe) {
  padding-top: 56.25%;
}

.captcha-iframe {
  background: #fff;
}

.player-wrapper--fullscreen .player-iframe {
  position: static;
  flex: 1;
}

.player-wrapper--fullscreen .video-area:has(.player-iframe) {
  padding-top: 0;
  display: flex;
  flex-direction: column;
}

.video-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
  background: #000;
  z-index: 2;
}

.video-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #ef4444;
  font-size: 14px;
  background: rgba(0,0,0,0.85);
  padding: 24px;
  text-align: center;
  z-index: 3;
}

.video-error p { color: var(--text-secondary); max-width: 360px; line-height: 1.6; }
.retry-btn { margin-top: 4px; }

.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(139,92,246,0.2);
  border-top-color: var(--accent-purple);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ── Footer ── */
.player-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary); border-top: 1px solid var(--border-subtle);
}

.save-btn { font-size: 13px; padding: 8px 16px; }

.save-btn--saved {
  background: rgba(139,92,246,0.12);
  border-color: var(--border-accent);
  color: var(--accent-purple);
}

.player-source { font-size: 12px; color: var(--text-muted); }
</style>

<!-- Unscoped: Video.js theme overrides for dark mode -->
<style>
.vjs-theme-vider {
  --vjs-theme-vider--primary: #8b5cf6;
  --vjs-theme-vider--secondary: rgba(139, 92, 246, 0.6);
  font-family: 'Inter', sans-serif;
}

.vjs-theme-vider .vjs-control-bar {
  background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%);
  height: 44px;
  padding: 0 4px;
}

.vjs-theme-vider .vjs-play-progress,
.vjs-theme-vider .vjs-volume-level {
  background: var(--vjs-theme-vider--primary);
}

.vjs-theme-vider .vjs-load-progress div {
  background: rgba(255,255,255,0.15);
}

.vjs-theme-vider .vjs-slider:focus {
  text-shadow: none;
  box-shadow: 0 0 0 2px var(--vjs-theme-vider--secondary);
}

.vjs-theme-vider .vjs-big-play-button {
  background: rgba(139, 92, 246, 0.8);
  border: none;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  line-height: 64px;
  font-size: 28px;
  transition: all 0.2s ease;
}

.vjs-theme-vider .vjs-big-play-button:hover {
  background: rgba(139, 92, 246, 1);
  transform: scale(1.1);
}

.vjs-theme-vider .vjs-time-control {
  font-size: 12px;
  font-weight: 500;
  line-height: 44px;
}

.vjs-theme-vider .vjs-playback-rate .vjs-playback-rate-value {
  font-size: 12px;
  line-height: 44px;
}

.vjs-theme-vider .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
  background: rgba(20, 20, 30, 0.95);
  border-radius: 8px;
  backdrop-filter: blur(12px);
}

.vjs-theme-vider .vjs-menu li.vjs-selected {
  background: var(--vjs-theme-vider--primary);
  color: #fff;
}

.vjs-theme-vider .vjs-menu li:hover {
  background: rgba(139, 92, 246, 0.3);
  color: #fff;
}

.vjs-theme-vider .vjs-progress-control:hover .vjs-progress-holder {
  font-size: 14px;
}

/* Hide the default video.js poster to keep it clean */
.vjs-theme-vider .vjs-poster {
  display: none;
}

/* Skip forward/backward buttons */
.vjs-theme-vider .vjs-skip-backward,
.vjs-theme-vider .vjs-skip-forward {
  cursor: pointer;
  width: 44px !important;
}

/* Hide standard icon placeholder just for these custom buttons to free up center space */
.vjs-theme-vider .vjs-skip-backward .vjs-icon-placeholder,
.vjs-theme-vider .vjs-skip-forward .vjs-icon-placeholder {
  display: none !important;
}

.vjs-theme-vider .vjs-skip-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.vjs-theme-vider .vjs-skip-backward:hover .vjs-skip-icon,
.vjs-theme-vider .vjs-skip-forward:hover .vjs-skip-icon {
  opacity: 1;
  transform: scale(1.15);
}

.vjs-theme-vider .vjs-skip-icon svg text {
  font-family: 'Inter', Arial, sans-serif;
}
</style>

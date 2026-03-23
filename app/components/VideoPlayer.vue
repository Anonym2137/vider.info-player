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
        <span class="mode-badge" :class="useNativePlayer ? 'mode-badge--stream' : 'mode-badge--embed'">
          {{ useNativePlayer ? '▶ Direct Stream' : '◻ Embed' }}
        </span>

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

      <!-- Native HTML5 video (direct stream via proxy) -->
      <template v-if="useNativePlayer && proxyUrl">
        <video
          ref="videoEl"
          :key="proxyUrl"
          :src="proxyUrl"
          class="native-video"
          controls
          preload="metadata"
          @error="onVideoError"
          @loadedmetadata="loading = false"
        />
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
interface Props {
  /** Proxy URL to our /api/stream endpoint — preferred playback method */
  proxyUrl: string | null
  /** Direct stream URL on stream.vider.info (for reference/display) */
  streamUrl: string | null
  /** Embed iframe URL (fallback) */
  embedUrl: string | null
  videoId: string
  originalUrl: string
  initialTitle?: string
}

const props = withDefaults(defineProps<Props>(), { initialTitle: '' })
defineEmits<{ close: [] }>()

const { addVideo, removeVideo, watchlist, updateTitle } = useViderPlayer()

// ── State ──────────────────────────────────────────────────────────────────────
const loading       = ref(true)
const isFullscreen  = ref(false)
const isEditing     = ref(false)
const videoError    = ref('')
const titleInputEl  = ref<HTMLInputElement | null>(null)
const videoEl       = ref<HTMLVideoElement | null>(null)

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
    : props.embedUrl?.replace('https://vider.info', 'vider.info') ?? '',
)

// ── Watchers ───────────────────────────────────────────────────────────────────
watch([() => props.proxyUrl, () => props.embedUrl], () => {
  loading.value = true
  videoError.value = ''
  useNativePlayer.value = !!props.proxyUrl
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

function onVideoError() {
  loading.value = false
  videoError.value = 'Could not load the stream. Your cookies may be expired or the video is restricted. Try embed mode.'
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
  padding-top: 56.25%;
  background: #000;
}

.player-wrapper--fullscreen .video-area {
  padding-top: 0;
  flex: 1;
}

.native-video,
.player-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}

.player-wrapper--fullscreen .native-video,
.player-wrapper--fullscreen .player-iframe {
  position: static;
  flex: 1;
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

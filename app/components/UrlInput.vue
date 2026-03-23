<template>
  <div class="url-input-card glass">
    <div class="url-input-header">
      <div class="icon-wrap">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.362a1 1 0 0 1-1.447.894L15 14M3 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"/>
        </svg>
      </div>
      <div>
        <h2 class="input-title">Play a vider.info video</h2>
        <p class="input-hint">Paste a vider.info URL (e.g. <code>vider.info/vid/+fsv11s8</code>) — the real stream is resolved server-side</p>
      </div>
    </div>

    <!-- Cookie warning banner -->
    <Transition name="fade">
      <div v-if="cookieStatus === 'missing'" class="cookie-banner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Auth cookies not set — videos may not load. <NuxtLink to="/settings" class="cookie-link">Configure cookies →</NuxtLink></span>
      </div>
    </Transition>

    <form class="input-row" @submit.prevent="handleSubmit">
      <div
        class="input-wrap"
        :class="{
          'input-wrap--error': error,
          'input-wrap--focus': isFocused,
          'input-wrap--loading': resolving,
        }"
      >
        <!-- Link icon -->
        <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>

        <input
          id="vider-url-input"
          v-model="url"
          type="text"
          class="url-input"
          placeholder="https://vider.info/vid/+fsv11s8"
          autocomplete="off"
          spellcheck="false"
          :disabled="resolving"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @paste="handlePaste"
        />

        <!-- Spinner while resolving -->
        <div v-if="resolving" class="input-spinner" aria-label="Resolving…"/>

        <!-- Clear button -->
        <button
          v-else-if="url"
          type="button"
          class="clear-btn"
          aria-label="Clear input"
          @click="url = ''; error = ''"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <button
        type="submit"
        class="btn btn-primary submit-btn"
        :disabled="!url.trim() || resolving"
      >
        <svg v-if="!resolving" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" fill="currentColor"/>
        </svg>
        <div v-else class="btn-spinner"/>
        {{ resolving ? 'Resolving…' : 'Play' }}
      </button>
    </form>

    <!-- Error -->
    <Transition name="shake">
      <p v-if="error" class="error-msg" role="alert">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ error }}
      </p>
    </Transition>

    <!-- Resolved stream info pill -->
    <Transition name="fade">
      <div v-if="resolvedInfo" class="resolved-pill">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span class="resolved-label">Stream resolved:</span>
        <span class="resolved-url">{{ resolvedInfo }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
interface ResolveResponse {
  streamUrl: string | null
  embedUrl: string | null
  title: string
  cookiesConfigured: boolean
}

interface CookieStatus {
  configured: boolean
  spfpSet: boolean
  spol_tgSet: boolean
}

const emit = defineEmits<{
  play: [payload: {
    streamUrl: string | null
    embedUrl: string | null
    proxyUrl: string | null
    title: string
    originalUrl: string
  }]
}>()

const url = ref('')
const error = ref('')
const isFocused = ref(false)
const resolving = ref(false)
const resolvedInfo = ref('')

// ── Check cookie status on mount ─────────────────────────────────────────────
const cookieStatus = ref<'unknown' | 'missing' | 'ok'>('unknown')

onMounted(async () => {
  try {
    const status = await $fetch<CookieStatus>('/api/cookies')
    cookieStatus.value = status.configured ? 'ok' : 'missing'
  } catch {
    cookieStatus.value = 'missing'
  }
})

// ── Submit handler ────────────────────────────────────────────────────────────
async function handleSubmit() {
  const raw = url.value.trim()
  if (!raw) return

  error.value = ''
  resolvedInfo.value = ''

  // Quick format check
  if (!raw.includes('vider.info')) {
    error.value = 'Please paste a vider.info URL (e.g. https://vider.info/vid/+fsv11s8)'
    return
  }

  resolving.value = true

  try {
    const data = await $fetch<ResolveResponse>('/api/resolve', {
      method: 'POST',
      body: { url: raw },
    })

    if (!data.streamUrl && !data.embedUrl) {
      error.value = 'Could not find a playable stream on this page. Make sure your vider.info cookies are configured.'
      return
    }

    // Build proxy URL so browser can load the authenticated stream
    const proxyUrl = data.streamUrl
      ? `/api/stream?url=${encodeURIComponent(data.streamUrl)}`
      : null

    if (data.streamUrl) {
      // Show a truncated version of the resolved URL
      resolvedInfo.value = data.streamUrl.replace('https://stream.vider.info', 'stream.vider.info').slice(0, 60) + '…'
    }

    // Update cookie status if the server told us
    if (data.cookiesConfigured) cookieStatus.value = 'ok'

    emit('play', {
      streamUrl: data.streamUrl,
      embedUrl:  data.embedUrl,
      proxyUrl,
      title:     data.title || `Video from ${raw}`,
      originalUrl: raw,
    })
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string }; message?: string })?.data?.message
      || (err as Error)?.message
      || 'Failed to resolve the video URL'
    error.value = msg
  } finally {
    resolving.value = false
  }
}

// ── Auto-submit on paste when URL looks valid ─────────────────────────────────
function handlePaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData('text') || ''
  if (pasted.includes('vider.info')) {
    nextTick(handleSubmit)
  }
}
</script>

<style scoped>
.url-input-card {
  border-radius: var(--radius-xl);
  padding: 28px 28px 20px;
  animation: fadeInUp 0.4s ease both;
}

.url-input-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
}

.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid var(--border-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-purple);
  flex-shrink: 0;
  margin-top: 2px;
}

.input-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 2px;
}

.input-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.input-hint code {
  font-family: monospace;
  background: rgba(139, 92, 246, 0.1);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--accent-purple);
  font-size: 12px;
}

/* Cookie warning */
.cookie-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.25);
  border-radius: var(--radius-md);
  color: #fbbf24;
  font-size: 13px;
  margin-bottom: 14px;
}

.cookie-link {
  color: #fbbf24;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Input row */
.input-row {
  display: flex;
  gap: 10px;
}

.input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all var(--transition);
}

.input-wrap--focus   { border-color: var(--accent-purple); box-shadow: 0 0 0 4px rgba(139,92,246,0.12); }
.input-wrap--error   { border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
.input-wrap--loading { opacity: 0.7; }

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.url-input {
  width: 100%;
  padding: 12px 40px 12px 36px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: 'Inter', monospace;
  font-size: 13.5px;
}

.url-input::placeholder { color: var(--text-muted); }
.url-input:disabled      { cursor: not-allowed; }

.clear-btn {
  position: absolute;
  right: 10px;
  background: var(--bg-card);
  border: none;
  color: var(--text-muted);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.clear-btn:hover { color: var(--text-primary); background: var(--bg-card-hover); }

/* Inline spinner inside input */
.input-spinner {
  position: absolute;
  right: 12px;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(139,92,246,0.2);
  border-top-color: var(--accent-purple);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.submit-btn {
  padding: 12px 22px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  min-width: 110px;
}

.submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Error */
.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 13px;
  margin-top: 10px;
}

/* Resolved info */
.resolved-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 7px 12px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: var(--radius-md);
  color: #22c55e;
  font-size: 12px;
}

.resolved-label { font-weight: 600; flex-shrink: 0; }
.resolved-url   { font-family: monospace; color: rgba(34,197,94,0.8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Animations */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
.shake-enter-active { animation: shake 0.4s ease; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-enter-from { opacity: 0; transform: translateY(-4px); }
.fade-leave-to   { opacity: 0; }
</style>

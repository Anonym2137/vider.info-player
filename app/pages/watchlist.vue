<template>
  <div class="page-layout">
    <AppNavbar />

    <main class="main-content">
      <div class="container">

        <div class="page-header">
          <div>
            <h1 class="page-title">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 8l6 4-6 4V8z"/>
              </svg>
              Watchlist
            </h1>
            <p class="page-subtitle">
              {{ watchlist.length }} saved video{{ watchlist.length !== 1 ? 's' : '' }}
            </p>
          </div>

          <div class="page-actions">
            <button v-if="watchlist.length > 0" class="btn btn-ghost" @click="confirmClear">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              Clear All
            </button>
          </div>
        </div>

        <!-- Active player (when selected from watchlist) -->
        <Transition name="fade">
          <section v-if="currentVideo" class="player-section" aria-label="Video player">
            <VideoPlayer
              :proxy-url="currentVideo.proxyUrl"
              :stream-url="currentVideo.streamUrl"
              :embed-url="currentVideo.embedUrl"
              :video-id="currentVideo.videoId"
              :original-url="currentVideo.originalUrl"
              :initial-title="currentVideo.title"
              @close="currentVideo = null"
            />
          </section>
        </Transition>

        <!-- Watchlist grid -->
        <Transition name="fade" mode="out-in">
          <div v-if="watchlist.length > 0" class="watchlist-grid">
            <TransitionGroup name="card-list" tag="div" class="cards-grid">
              <VideoCard
                v-for="video in watchlist"
                :key="video.id"
                :video="video"
                :active="currentVideo?.videoId === video.id"
                @play="playVideo"
                @remove="removeVideo"
              />
            </TransitionGroup>
          </div>

          <!-- Empty state -->
          <div v-else class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 8l6 4-6 4V8z"/>
              </svg>
            </div>
            <h2>Your watchlist is empty</h2>
            <p>Head back to the home page and add some vider.info videos.</p>
            <NuxtLink to="/" class="btn btn-primary go-home-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Go to Home
            </NuxtLink>
          </div>
        </Transition>

        <!-- Clear confirmation dialog -->
        <Teleport to="body">
          <Transition name="fade">
            <div v-if="showClearConfirm" class="dialog-overlay" @click.self="showClearConfirm = false">
              <div class="dialog glass">
                <div class="dialog-icon danger">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </div>
                <h3>Clear all videos?</h3>
                <p>This will permanently remove all {{ watchlist.length }} videos from your watchlist.</p>
                <div class="dialog-actions">
                  <button class="btn btn-ghost" @click="showClearConfirm = false">Cancel</button>
                  <button class="btn btn-danger" @click="doClear">Delete All</button>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { ViderVideo } from '~/composables/useViderPlayer'

useSeoMeta({
  title: 'Watchlist – Vider Player',
  description: 'Your saved vider.info videos.',
})

const { watchlist, removeVideo, clearWatchlist } = useViderPlayer()

interface CurrentVideo {
  streamUrl: string | null
  proxyUrl: string | null
  embedUrl: string | null
  videoId: string
  originalUrl: string
  title: string
}

const currentVideo = ref<CurrentVideo | null>(null)
const showClearConfirm = ref(false)

function playVideo(video: ViderVideo) {
  currentVideo.value = {
    streamUrl: null,
    proxyUrl: null,
    embedUrl: video.embedUrl,
    videoId: video.id,
    originalUrl: video.originalUrl,
    title: video.title,
  }
  nextTick(() => {
    document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function confirmClear() {
  showClearConfirm.value = true
}

function doClear() {
  clearWatchlist()
  currentVideo.value = null
  showClearConfirm.value = false
}
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 40px 0 80px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  padding-left: 36px;
}

.page-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.player-section {
  margin-bottom: 36px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* TransitionGroup list animations */
.card-list-enter-active { transition: all 0.3s ease; }
.card-list-leave-active  { transition: all 0.2s ease; }
.card-list-enter-from    { opacity: 0; transform: scale(0.95) translateY(10px); }
.card-list-leave-to      { opacity: 0; transform: scale(0.9); }
.card-list-move          { transition: transform 0.3s ease; }

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px;
  color: var(--text-muted);
  gap: 12px;
}

.empty-icon {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.empty-state h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-secondary);
}

.empty-state p { font-size: 14px; color: var(--text-muted); }

.go-home-btn { margin-top: 8px; }

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.dialog {
  max-width: 420px;
  width: 100%;
  border-radius: var(--radius-xl);
  padding: 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.dialog-icon.danger {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.dialog h3 { font-size: 20px; font-weight: 700; }
.dialog p  { font-size: 14px; color: var(--text-secondary); }

.dialog-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  width: 100%;
  justify-content: center;
}
</style>

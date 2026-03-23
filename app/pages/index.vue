<template>
  <div class="page-layout">
    <AppNavbar />

    <main class="main-content">
      <div class="container">

        <!-- Hero Section -->
        <section class="hero" aria-label="Hero">
          <div class="hero-glow" aria-hidden="true"/>
          <div class="hero-badge">
            <span class="badge-dot"/>
            <span>vider.info compatible player</span>
          </div>
          <h1 class="hero-title">
            Your <span class="gradient-text">Premium</span><br/>
            Video Player
          </h1>
          <p class="hero-subtitle">
            Paste any vider.info link — video page, embed URL, or iframe code —<br/>
            and enjoy it in a clean, distraction-free player.
          </p>
        </section>

        <!-- URL Input -->
        <section class="input-section" aria-label="Video input">
          <UrlInput @play="handlePlay" />
        </section>

        <!-- Active Player -->
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

        <!-- Recent Watchlist Preview -->
        <section v-if="recentVideos.length > 0" class="recent-section" aria-label="Recent videos">
          <div class="section-header">
            <h2 class="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Recently Added
            </h2>
            <NuxtLink to="/watchlist" class="see-all-link">
              See all ({{ watchlist.length }})
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </NuxtLink>
          </div>

          <div class="cards-grid">
            <VideoCard
              v-for="video in recentVideos"
              :key="video.id"
              :video="video"
              :active="currentVideo?.videoId === video.id"
              @play="playFromWatchlist"
              @remove="removeVideo"
            />
          </div>
        </section>

        <!-- Empty state when nothing saved -->
        <section v-else-if="!currentVideo" class="empty-state" aria-label="Getting started">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.362a1 1 0 0 1-1.447.894L15 14M3 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"/>
            </svg>
          </div>
          <h3>Start watching</h3>
          <p>Paste a vider.info URL above to start watching instantly.<br/>Your videos will be saved to your watchlist.</p>
        </section>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { ViderVideo } from '~/composables/useViderPlayer'

useSeoMeta({
  title: 'Vider Player – Watch Movies & Videos',
  description: 'Stream vider.info videos in a beautiful, distraction-free player. Paste a link and play instantly.',
  ogTitle:  'Vider Player',
  ogDescription: 'Your premium vider.info video player',
})

const { watchlist, addVideo, removeVideo } = useViderPlayer()

const recentVideos = computed(() => watchlist.value.slice(0, 4))

interface CurrentVideo {
  streamUrl: string | null
  proxyUrl: string | null
  embedUrl: string | null
  videoId: string
  originalUrl: string
  title: string
}

const currentVideo = ref<CurrentVideo | null>(null)

interface PlayPayload {
  streamUrl: string | null
  embedUrl: string | null
  proxyUrl: string | null
  title: string
  originalUrl: string
}

function handlePlay(payload: PlayPayload) {
  // Derive a video ID from the original URL or embed URL
  const idMatch = (payload.embedUrl ?? payload.originalUrl).match(
    /vider\.info\/(?:embed|vid|video|v)\/([a-zA-Z0-9_+\-]+)/
  )
  const videoId = idMatch?.[1] ?? payload.originalUrl.split('/').pop() ?? 'unknown'

  // Save to watchlist
  addVideo(payload.originalUrl, payload.title || `Video ${videoId.slice(0, 8)}`)

  currentVideo.value = {
    streamUrl: payload.streamUrl,
    proxyUrl:  payload.proxyUrl,
    embedUrl:  payload.embedUrl,
    videoId,
    originalUrl: payload.originalUrl,
    title: watchlist.value.find((v) => v.id === videoId)?.title ?? payload.title,
  }

  // Scroll to player
  nextTick(() => {
    document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function playFromWatchlist(video: ViderVideo) {
  currentVideo.value = {
    streamUrl: null,
    proxyUrl:  null,
    embedUrl:  video.embedUrl,
    videoId:   video.id,
    originalUrl: video.originalUrl,
    title: video.title,
  }
  nextTick(() => {
    document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
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

.hero {
  text-align: center;
  padding: 60px 0 40px;
  position: relative;
}

.hero-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.18) 0%, transparent 70%);
  pointer-events: none;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid var(--border-accent);
  color: var(--accent-purple);
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 24px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-purple);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

.hero-title {
  font-size: clamp(36px, 6vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 18px;
}

.hero-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 520px;
  margin: 0 auto;
}

.input-section {
  max-width: 800px;
  margin: 0 auto 32px;
}

.player-section {
  max-width: 960px;
  margin: 0 auto 40px;
}

.recent-section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.see-all-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--accent-purple);
  font-weight: 500;
  transition: gap var(--transition);
}

.see-all-link:hover { gap: 8px; }

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 24px;
  color: var(--text-muted);
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  line-height: 1.7;
}
</style>

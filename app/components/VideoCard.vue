<template>
  <article class="video-card glass" :class="{ 'video-card--active': active }">
    <div class="card-thumb" @click="$emit('play', video)">
      <div class="thumb-preview">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" fill="rgba(139,92,246,0.6)"/>
        </svg>
      </div>
      <div class="play-overlay">
        <div class="play-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/>
          </svg>
        </div>
      </div>
      <div v-if="active" class="now-playing-badge">
        <span class="pulse-dot"/>Now Playing
      </div>
    </div>

    <div class="card-body">
      <h3 class="card-title" :title="video.title">{{ video.title }}</h3>
      <p class="card-url">{{ video.embedUrl }}</p>
      <div class="card-footer">
        <time class="card-date">{{ formatDate(video.addedAt) }}</time>
        <div class="card-actions">
          <button class="action-btn" title="Play" @click="$emit('play', video)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/>
            </svg>
          </button>
          <button class="action-btn action-btn--danger" title="Remove" @click="$emit('remove', video.id)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ViderVideo } from '~/composables/useViderPlayer'

interface Props {
  video: ViderVideo
  active?: boolean
}

defineProps<Props>()

defineEmits<{
  play: [video: ViderVideo]
  remove: [id: string]
}>()

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.video-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition);
  cursor: default;
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.3s ease both;
}

.video-card:hover {
  border-color: var(--border-accent);
  transform: translateY(-3px);
  box-shadow: var(--shadow-card), 0 0 24px rgba(139, 92, 246, 0.15);
}

.video-card--active {
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3), var(--shadow-glow);
}

.card-thumb {
  position: relative;
  padding-top: 56.25%;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.08) 0%,
    rgba(236, 72, 153, 0.08) 100%
  );
  cursor: pointer;
  overflow: hidden;
}

.thumb-preview {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    45deg,
    rgba(255,255,255,0.01) 0px,
    rgba(255,255,255,0.01) 1px,
    transparent 1px,
    transparent 8px
  );
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition);
}

.card-thumb:hover .play-overlay {
  background: rgba(0, 0, 0, 0.35);
}

.play-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transform: scale(0.8);
  transition: all var(--transition);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.5);
}

.card-thumb:hover .play-circle {
  opacity: 1;
  transform: scale(1);
}

.now-playing-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(139, 92, 246, 0.85);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  animation: pulse-glow 1.2s ease-in-out infinite;
}

.card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-url {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.card-date {
  font-size: 11px;
  color: var(--text-muted);
}

.card-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.action-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-accent);
  color: var(--accent-purple);
}

.action-btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}
</style>

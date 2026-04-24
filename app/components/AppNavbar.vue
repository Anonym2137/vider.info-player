<template>
  <header class="navbar glass">
    <div class="container navbar-inner">
      <!-- Logo -->
      <NuxtLink to="/" class="logo" aria-label="Vider Player Home">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" fill="currentColor"/>
          </svg>
        </div>
        <span class="logo-text">Vider<span class="gradient-text">Player</span></span>
      </NuxtLink>

      <!-- Nav links -->
      <nav class="nav-links" role="navigation" aria-label="Main navigation">
        <NuxtLink to="/" class="nav-link" active-class="nav-link--active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </NuxtLink>
        <NuxtLink to="/watchlist" class="nav-link" active-class="nav-link--active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 8l6 4-6 4V8z"/>
          </svg>
          Watchlist
          <span v-if="watchlist.length > 0" class="badge">{{ watchlist.length }}</span>
        </NuxtLink>

      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const { watchlist } = useViderPlayer()
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border-subtle);
  border-top: none;
  border-left: none;
  border-right: none;
  border-radius: 0;
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
  transition: opacity var(--transition);
}

.logo:hover { opacity: 0.85; }

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition);
  position: relative;
}

.nav-link:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.nav-link--active {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-purple);
}

.badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--accent-purple);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>

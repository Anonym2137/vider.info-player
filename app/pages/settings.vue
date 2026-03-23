<template>
  <div class="page-layout">
    <AppNavbar />

    <main class="main-content">
      <div class="container">

        <div class="page-header">
          <div>
            <h1 class="page-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
              </svg>
              Cookie Settings
            </h1>
            <p class="page-subtitle">Authenticate with vider.info to stream videos directly</p>
          </div>
        </div>

        <!-- How-to guide -->
        <div class="guide-card glass">
          <h2 class="guide-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            How to get your vider.info cookies
          </h2>
          <ol class="guide-steps">
            <li>Open <a href="https://vider.info" target="_blank" rel="noopener" class="ext-link">vider.info</a> in your browser and log in</li>
            <li>Open DevTools → <strong>Application</strong> tab → <strong>Cookies</strong> → <code>https://vider.info</code></li>
            <li>Copy the value of <code>spfp</code> and <code>spol_tg</code></li>
            <li>Paste them below and click <strong>Save Cookies</strong></li>
          </ol>
          <p class="guide-note">
            ⚠️ Cookies are stored <em>only in server memory</em> and are never sent anywhere except back to vider.info on your behalf.
            They will be cleared when the server restarts.
          </p>
        </div>

        <!-- Cookie form -->
        <div class="settings-card glass">
          <div class="status-row">
            <div class="status-indicator" :class="statusClass">
              <span class="status-dot"/>
              {{ statusText }}
            </div>
            <button v-if="status?.configured" class="btn btn-ghost clear-cookies-btn" @click="clearCookies">
              Clear
            </button>
          </div>

          <form class="cookie-form" @submit.prevent="saveCookies">
            <!-- spfp -->
            <div class="field-group">
              <label for="spfp-input" class="field-label">
                <code>spfp</code>
                <span class="field-badge">session fingerprint</span>
              </label>
              <div class="field-input-wrap" :class="{ 'field-input-wrap--set': !!fields.spfp }">
                <input
                  id="spfp-input"
                  v-model="fields.spfp"
                  type="text"
                  class="field-input"
                  placeholder="006cd31b2461c850bed53704dd50b288"
                  autocomplete="off"
                  spellcheck="false"
                />
                <span v-if="fields.spfp" class="field-check">✓</span>
              </div>
            </div>

            <!-- spol_tg -->
            <div class="field-group">
              <label for="spol-input" class="field-label">
                <code>spol_tg</code>
                <span class="field-badge">geo / policy token</span>
              </label>
              <div class="field-input-wrap" :class="{ 'field-input-wrap--set': !!fields.spol_tg }">
                <input
                  id="spol-input"
                  v-model="fields.spol_tg"
                  type="text"
                  class="field-input"
                  placeholder="eu%3Atrue%7Cip%3A80.49.237.102"
                  autocomplete="off"
                  spellcheck="false"
                />
                <span v-if="fields.spol_tg" class="field-check">✓</span>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="saving || (!fields.spfp && !fields.spol_tg)"
              >
                <svg v-if="!saving" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div v-else class="btn-spinner"/>
                {{ saving ? 'Saving…' : 'Save Cookies' }}
              </button>

              <Transition name="fade">
                <span v-if="savedMsg" class="saved-msg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ savedMsg }}
                </span>
              </Transition>
            </div>
          </form>
        </div>

        <!-- Quick test -->
        <div class="test-card glass">
          <h2 class="guide-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Quick test
          </h2>
          <form class="test-form" @submit.prevent="runTest">
            <input
              id="test-url-input"
              v-model="testUrl"
              type="text"
              class="field-input"
              placeholder="https://vider.info/vid/+fsv11s8"
              autocomplete="off"
            />
            <button type="submit" class="btn btn-ghost" :disabled="testing || !testUrl.trim()">
              <div v-if="testing" class="btn-spinner-dark"/>
              {{ testing ? 'Testing…' : 'Test resolve' }}
            </button>
          </form>

          <Transition name="fade">
            <div v-if="testResult" class="test-result" :class="testResult.ok ? 'test-result--ok' : 'test-result--err'">
              <strong>{{ testResult.ok ? '✓ Stream found' : '✗ No stream found' }}</strong>
              <code v-if="testResult.streamUrl">{{ testResult.streamUrl }}</code>
              <span v-if="testResult.error">{{ testResult.error }}</span>
            </div>
          </Transition>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Settings – Vider Player',
  description: 'Configure your vider.info authentication cookies.',
})

interface CookieStatus { configured: boolean; spfpSet: boolean; spol_tgSet: boolean }
interface ResolveResponse { streamUrl: string | null; embedUrl: string | null; title: string }

const fields = reactive({ spfp: '', spol_tg: '' })
const saving = ref(false)
const savedMsg = ref('')
const status = ref<CookieStatus | null>(null)
const testUrl = ref('')
const testing = ref(false)
const testResult = ref<{ ok: boolean; streamUrl?: string; error?: string } | null>(null)

const statusClass = computed(() => ({
  'status--ok':      status.value?.configured,
  'status--partial': !status.value?.configured && (status.value?.spfpSet || status.value?.spol_tgSet),
  'status--missing': !status.value?.configured && !status.value?.spfpSet && !status.value?.spol_tgSet,
}))

const statusText = computed(() => {
  if (!status.value) return 'Checking…'
  if (status.value.configured) return 'Cookies configured  ✓'
  if (status.value.spfpSet || status.value.spol_tgSet) return 'Partially configured'
  return 'No cookies set — videos may not load'
})

onMounted(async () => {
  try {
    status.value = await $fetch<CookieStatus>('/api/cookies')
  } catch {}
})

async function saveCookies() {
  saving.value = true
  savedMsg.value = ''
  try {
    await $fetch('/api/cookies', {
      method: 'POST',
      body: { spfp: fields.spfp || undefined, spol_tg: fields.spol_tg || undefined },
    })
    status.value = await $fetch<CookieStatus>('/api/cookies')
    savedMsg.value = 'Cookies saved!'
    fields.spfp = ''
    fields.spol_tg = ''
    setTimeout(() => { savedMsg.value = '' }, 3000)
  } catch (err: unknown) {
    savedMsg.value = (err as Error)?.message ?? 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function clearCookies() {
  await $fetch('/api/cookies', { method: 'POST', body: { spfp: '', spol_tg: '' } })
  status.value = await $fetch<CookieStatus>('/api/cookies')
}

async function runTest() {
  const url = testUrl.value.trim()
  if (!url) return
  testing.value = true
  testResult.value = null
  try {
    const data = await $fetch<ResolveResponse>('/api/resolve', { method: 'POST', body: { url } })
    testResult.value = data.streamUrl
      ? { ok: true, streamUrl: data.streamUrl }
      : { ok: false, error: 'No stream URL extracted — check your cookies or try a different video.' }
  } catch (err: unknown) {
    testResult.value = {
      ok: false,
      error: (err as { data?: { message?: string } })?.data?.message ?? (err as Error)?.message ?? 'Request failed',
    }
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.page-layout { min-height: 100vh; display: flex; flex-direction: column; }
.main-content { flex: 1; padding: 40px 0 80px; }

.page-header { margin-bottom: 32px; }
.page-title  { display: flex; align-items: center; gap: 10px; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-muted); padding-left: 34px; }

/* Guide card */
.guide-card, .settings-card, .test-card {
  border-radius: var(--radius-xl);
  padding: 28px;
  margin-bottom: 20px;
  animation: fadeInUp 0.35s ease both;
}

.guide-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 16px;
}

.guide-steps {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.guide-steps code {
  font-family: monospace;
  background: rgba(139,92,246,0.1);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--accent-purple);
  font-size: 12px;
}

.ext-link { color: var(--accent-purple); text-decoration: underline; text-underline-offset: 2px; }

.guide-note {
  margin-top: 16px;
  padding: 12px 14px;
  background: rgba(251,191,36,0.07);
  border: 1px solid rgba(251,191,36,0.2);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: #fbbf24;
  line-height: 1.6;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid;
}
.status--ok      { background: rgba(34,197,94,0.1); color: #22c55e; border-color: rgba(34,197,94,0.25); }
.status--partial { background: rgba(251,191,36,0.1); color: #fbbf24; border-color: rgba(251,191,36,0.25); }
.status--missing { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.25); }

.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: currentColor;
  animation: pulse-glow 1.4s ease-in-out infinite;
}

.clear-cookies-btn { font-size: 12px; padding: 6px 12px; }

/* Form */
.cookie-form { display: flex; flex-direction: column; gap: 18px; }

.field-group { display: flex; flex-direction: column; gap: 8px; }

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.field-label code {
  font-family: monospace;
  background: rgba(139,92,246,0.12);
  color: var(--accent-purple);
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 13px;
}

.field-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  padding: 2px 7px;
  border-radius: 10px;
}

.field-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: border-color var(--transition);
}

.field-input-wrap--set { border-color: rgba(34,197,94,0.4); }
.field-input-wrap:focus-within { border-color: var(--accent-purple); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }

.field-input {
  flex: 1;
  padding: 11px 40px 11px 14px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: monospace;
  font-size: 13px;
}

.field-input::placeholder { color: var(--text-muted); }

.field-check {
  position: absolute;
  right: 12px;
  color: #22c55e;
  font-size: 14px;
  font-weight: 700;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}

.saved-msg {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #22c55e;
  font-weight: 500;
}

/* Test */
.test-form {
  display: flex;
  gap: 10px;
}

.test-result {
  margin-top: 14px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.test-result--ok  { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; }
.test-result--err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
.test-result code { font-family: monospace; font-size: 12px; color: rgba(34,197,94,0.8); word-break: break-all; }

.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-spinner-dark {
  width: 14px; height: 14px;
  border: 2px solid var(--border-subtle);
  border-top-color: var(--text-secondary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

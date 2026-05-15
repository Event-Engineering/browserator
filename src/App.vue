<template>
  <div class="app">
    <header class="header">
      <div class="url-bar">
        <input
          v-model="urlInput"
          @keyup.enter="openWindow"
          placeholder="https://example.com"
          class="url-input"
          type="text"
          spellcheck="false"
        />
        <select
          v-model="selectedDisplayId"
          class="display-select"
          :disabled="displays.length <= 1"
          :title="displays.length <= 1 ? 'Only one display detected' : 'Choose display'"
        >
          <option v-for="d in displays" :key="d.id" :value="d.id">
            {{ d.label }}{{ d.isPrimary ? ' (Primary)' : '' }}
          </option>
        </select>
        <button @click="openWindow" class="btn btn-primary" :disabled="!urlInput.trim()">
          Open
        </button>
      </div>
    </header>

    <main class="main">
      <div v-if="windows.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <p class="empty-title">No browser windows open</p>
        <p class="empty-hint">Enter a URL above to open a fullscreen browser window</p>
      </div>

      <div v-else class="window-grid">
        <WindowCard
          v-for="win in windows"
          :key="win.id"
          :win="win"
          :thumbnail="thumbnails[win.id]"
          :display="displayById(win.displayId)"
          @refresh="refreshWindow(win.id)"
          @close="closeWindow(win.id)"
          @move="startMove(win)"
        />
      </div>
    </main>

    <MonitorPicker
      v-if="movingWindow"
      :win="movingWindow"
      :displays="displays"
      @move="doMove"
      @cancel="movingWindow = null"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import WindowCard from './components/WindowCard.vue'
import MonitorPicker from './components/MonitorPicker.vue'

export default {
  name: 'App',
  components: { WindowCard, MonitorPicker },
  setup() {
    const urlInput = ref('')
    const displays = ref([])
    const selectedDisplayId = ref(null)
    const windows = ref([])
    const thumbnails = ref({})
    const movingWindow = ref(null)
    let thumbTimer = null
    let unsubscribe = null

    function displayById(id) {
      return displays.value.find(d => d.id === id) || null
    }

    async function init() {
      displays.value = await window.api.listDisplays()
      const primary = displays.value.find(d => d.isPrimary) || displays.value[0]
      if (primary) selectedDisplayId.value = primary.id

      windows.value = await window.api.listWindows()

      unsubscribe = window.api.onWindowsUpdated(updated => {
        windows.value = updated
      })

      thumbTimer = setInterval(refreshThumbnails, 2500)
      refreshThumbnails()
    }

    async function refreshThumbnails() {
      for (const win of windows.value) {
        const thumb = await window.api.getThumbnail(win.id)
        if (thumb) thumbnails.value = { ...thumbnails.value, [win.id]: thumb }
      }
    }

    async function openWindow() {
      let url = urlInput.value.trim()
      if (!url) return
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url
      await window.api.openWindow(url, selectedDisplayId.value)
      urlInput.value = ''
    }

    async function refreshWindow(id) {
      await window.api.refreshWindow(id)
    }

    async function closeWindow(id) {
      await window.api.closeWindow(id)
      const next = { ...thumbnails.value }
      delete next[id]
      thumbnails.value = next
    }

    function startMove(win) {
      movingWindow.value = win
    }

    async function doMove({ windowId, displayId }) {
      await window.api.moveWindow(windowId, displayId)
      movingWindow.value = null
    }

    onMounted(init)

    onUnmounted(() => {
      if (unsubscribe) unsubscribe()
      if (thumbTimer) clearInterval(thumbTimer)
    })

    return {
      urlInput, displays, selectedDisplayId, windows, thumbnails, movingWindow,
      displayById, openWindow, refreshWindow, closeWindow, startMove, doMove
    }
  }
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.url-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.url-input:focus {
  border-color: var(--accent);
}

.url-input::placeholder {
  color: var(--text-secondary);
}

.display-select {
  padding: 8px 10px;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  white-space: nowrap;
  max-width: 180px;
}

.display-select:disabled {
  opacity: 0.45;
  cursor: default;
}

.btn {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.btn-primary {
  background: var(--accent);
  color: #0d1117;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.82;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
  color: var(--text-secondary);
}

.empty-icon {
  opacity: 0.25;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 15px;
  color: var(--text-primary);
}

.empty-hint {
  font-size: 12px;
}

.window-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
</style>

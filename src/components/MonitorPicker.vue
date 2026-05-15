<template>
  <div class="overlay" @click.self="$emit('cancel')">
    <div class="picker">
      <div class="picker-header">
        <h3>Move to Screen</h3>
        <button @click="$emit('cancel')" class="close-btn" title="Cancel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="picker-body">
        <div v-if="displays.length <= 1" class="single-display-msg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4">
            <rect x="2" y="3" width="20" height="14" rx="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <p>Only one display detected.</p>
          <p class="hint">Connect another monitor and relaunch to move windows between screens.</p>
        </div>

        <template v-else>
          <p class="instruction">Click a screen to move the window there.</p>
          <div class="layout-wrap">
            <div
              class="layout"
              :style="{ width: layout.width + 'px', height: layout.height + 'px' }"
            >
              <div
                v-for="d in layout.displays"
                :key="d.id"
                class="monitor"
                :class="{
                  'is-current': d.id === win.displayId,
                  'is-target': d.id !== win.displayId
                }"
                :style="{ left: d.x + 'px', top: d.y + 'px', width: d.width + 'px', height: d.height + 'px' }"
                @click="d.id !== win.displayId && select(d.id)"
              >
                <span class="monitor-name">{{ d.label }}</span>
                <span v-if="d.isPrimary" class="badge badge-primary">Primary</span>
                <div v-if="d.id === win.displayId" class="window-indicator">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                    <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                  </svg>
                  <span>Here</span>
                </div>
                <div v-else class="move-hint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="5 9 2 12 5 15"></polyline>
                    <polyline points="9 5 12 2 15 5"></polyline>
                    <polyline points="15 19 12 22 9 19"></polyline>
                    <polyline points="19 9 22 12 19 15"></polyline>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                  </svg>
                  Move here
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="picker-footer">
        <button @click="$emit('cancel')" class="btn btn-cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

const LAYOUT_MAX_W = 520
const LAYOUT_MAX_H = 280

export default {
  name: 'MonitorPicker',
  props: {
    win: { type: Object, required: true },
    displays: { type: Array, required: true }
  },
  emits: ['move', 'cancel'],
  setup(props, { emit }) {
    const layout = computed(() => {
      if (!props.displays.length) return { width: 0, height: 0, displays: [] }

      // Windows uses primary-DIP units for positive positions (right/below of primary)
      // but each display's own DIP for negative positions (left/above of primary).
      // Sizes always use each display's own scaleFactor.
      const pSF = props.displays.find(d => d.isPrimary)?.scaleFactor || 1
      const physX = d => d.bounds.x >= 0 ? d.bounds.x * pSF : d.bounds.x * d.scaleFactor
      const physY = d => d.bounds.y >= 0 ? d.bounds.y * pSF : d.bounds.y * d.scaleFactor
      const physW = d => d.bounds.width * d.scaleFactor
      const physH = d => d.bounds.height * d.scaleFactor

      const minX = Math.min(...props.displays.map(d => physX(d)))
      const minY = Math.min(...props.displays.map(d => physY(d)))
      const maxX = Math.max(...props.displays.map(d => physX(d) + physW(d)))
      const maxY = Math.max(...props.displays.map(d => physY(d) + physH(d)))

      const totalW = maxX - minX
      const totalH = maxY - minY
      const scale = Math.min(LAYOUT_MAX_W / totalW, LAYOUT_MAX_H / totalH)

      return {
        width: Math.round(totalW * scale),
        height: Math.round(totalH * scale),
        displays: props.displays.map(d => ({
          id: d.id,
          label: d.label,
          isPrimary: d.isPrimary,
          x: Math.round((physX(d) - minX) * scale),
          y: Math.round((physY(d) - minY) * scale),
          width: Math.round(physW(d) * scale),
          height: Math.round(physH(d) * scale)
        }))
      }
    })

    function select(displayId) {
      emit('move', { windowId: props.win.id, displayId })
    }

    return { layout, select }
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(3px);
}

.picker {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 620px;
  max-width: 92vw;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.picker-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  color: var(--text-secondary);
  padding: 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.picker-body {
  padding: 24px;
}

.instruction {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  text-align: center;
}

.layout-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout {
  position: relative;
}

.monitor {
  position: absolute;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
  transition: background 0.15s, border-color 0.15s;
  border: 2px solid transparent;
}

.is-current {
  background: rgba(157, 119, 245, 0.12);
  border-color: var(--accent);
  cursor: default;
}

.is-target {
  background: var(--bg-dark);
  border-color: var(--border);
  cursor: pointer;
}

.is-target:hover {
  background: rgba(157, 119, 245, 0.07);
  border-color: rgba(157, 119, 245, 0.5);
}

.is-target:hover .move-hint {
  opacity: 1;
}

.monitor-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.badge {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.badge-primary {
  background: rgba(157, 119, 245, 0.15);
  color: var(--accent);
}

.window-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--accent);
  font-size: 10px;
  margin-top: 2px;
}

.move-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.15s;
  margin-top: 2px;
}

.single-display-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
  color: var(--text-secondary);
  text-align: center;
}

.hint {
  font-size: 11px;
  max-width: 300px;
  line-height: 1.5;
}

.picker-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn-cancel {
  background: var(--bg-dark);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  transition: background 0.12s, color 0.12s;
}

.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>

<template>
  <div class="card">
    <div class="thumbnail-wrap">
      <img v-if="thumbnail" :src="thumbnail" class="thumbnail" :alt="win.url" />
      <div v-else class="thumbnail-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>Loading preview…</span>
      </div>
    </div>

    <div class="card-body">
      <div class="url" :title="win.url">{{ win.url }}</div>
      <div class="display-tag" v-if="display">
        <span class="dot" :class="{ 'dot-primary': display.isPrimary }"></span>
        {{ display.label }}{{ display.isPrimary ? ' · Primary' : '' }}
      </div>
    </div>

    <div class="card-actions">
      <button @click="$emit('refresh')" class="action-btn" title="Refresh page">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Refresh
      </button>
      <button @click="$emit('move')" class="action-btn" title="Move to another screen">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        Move
      </button>
      <button @click="$emit('close')" class="action-btn action-btn-danger" title="Close window">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Close
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WindowCard',
  props: {
    win: { type: Object, required: true },
    thumbnail: { type: String, default: null },
    display: { type: Object, default: null }
  },
  emits: ['refresh', 'move', 'close']
}
</script>

<style scoped>
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: rgba(88, 166, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(88, 166, 255, 0.15);
}

.thumbnail-wrap {
  aspect-ratio: 16 / 9;
  background: #090c10;
  overflow: hidden;
  flex-shrink: 0;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 11px;
}

.card-body {
  padding: 10px 12px;
  flex: 1;
  min-width: 0;
}

.url {
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
}

.display-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-secondary);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-secondary);
  flex-shrink: 0;
}

.dot-primary {
  background: var(--accent);
}

.card-actions {
  display: flex;
  border-top: 1px solid var(--border);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 4px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  transition: background 0.12s, color 0.12s;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-btn + .action-btn {
  border-left: 1px solid var(--border);
}

.action-btn-danger:hover {
  background: rgba(248, 81, 73, 0.12);
  color: var(--danger);
}
</style>

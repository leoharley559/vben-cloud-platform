<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

interface TabItem {
  icon: string;
  key: string;
  label: string;
}

defineProps<{
  tabs: TabItem[];
}>();

const activeTab = defineModel<string>('activeTab', { required: true });
</script>

<template>
  <div
    class="mobile-shell mx-auto min-h-screen max-w-lg bg-background-deep pb-16"
  >
    <div class="mobile-shell__content p-3">
      <slot></slot>
    </div>
    <footer
      class="mobile-shell__footer fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-border bg-card"
    >
      <div
        class="grid"
        :style="{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }"
      >
        <button
          v-for="item in tabs"
          :key="item.key"
          class="flex flex-col items-center py-2 text-xs"
          :class="
            activeTab === item.key
              ? 'text-blue-500 font-semibold'
              : 'text-gray-500'
          "
          type="button"
          @click="activeTab = item.key"
        >
          <IconifyIcon :icon="item.icon" class="mb-1 size-4" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </footer>
  </div>
</template>

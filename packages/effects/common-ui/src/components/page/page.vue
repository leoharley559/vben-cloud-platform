<script setup lang="ts">
import type { StyleValue } from 'vue';

import type { PageProps } from './types';

import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue';

import { CSS_VARIABLE_LAYOUT_CONTENT_HEIGHT } from '@vben-core/shared/constants';
import { cn } from '@vben-core/shared/utils';

defineOptions({
  name: 'Page',
});

const { autoContentHeight = false, heightOffset = 0 } =
  defineProps<PageProps>();

const headerHeight = ref(0);
const footerHeight = ref(0);
const shouldAutoHeight = ref(false);

const headerRef = useTemplateRef<HTMLDivElement>('headerRef');
const footerRef = useTemplateRef<HTMLDivElement>('footerRef');

const contentStyle = computed<StyleValue>(() => {
  if (autoContentHeight) {
    return {
      height: `calc(var(${CSS_VARIABLE_LAYOUT_CONTENT_HEIGHT}) - ${headerHeight.value}px - ${footerHeight.value}px - ${typeof heightOffset === 'number' ? `${heightOffset}px` : heightOffset})`,
      overflowY: shouldAutoHeight.value ? 'auto' : 'unset',
    };
  }
  return {};
});

async function calcContentHeight() {
  if (!autoContentHeight) {
    return;
  }
  await nextTick();
  headerHeight.value = headerRef.value?.offsetHeight || 0;
  footerHeight.value = footerRef.value?.offsetHeight || 0;
  setTimeout(() => {
    shouldAutoHeight.value = true;
  }, 30);
}

onMounted(() => {
  calcContentHeight();
});
</script>

<template>
  <div class="relative flex min-h-full flex-col">
    <div
      v-if="$slots.description || $slots.title || $slots.extra"
      ref="headerRef"
      :class="
        cn(
          'relative flex items-center border-b border-border bg-card px-4 py-2',
          headerClass,
        )
      "
    >
      <div class="flex min-w-0 flex-auto items-center gap-2">
        <slot name="title"></slot>
        <slot name="description"></slot>
      </div>

      <div v-if="$slots.extra" class="ml-3 shrink-0">
        <slot name="extra"></slot>
      </div>
    </div>

    <div :class="cn('h-full p-2 md:p-4', contentClass)" :style="contentStyle">
      <slot></slot>
    </div>
    <div
      v-if="$slots.footer"
      ref="footerRef"
      :class="cn('align-center flex bg-card px-6 py-4', footerClass)"
    >
      <slot name="footer"></slot>
    </div>
  </div>
</template>

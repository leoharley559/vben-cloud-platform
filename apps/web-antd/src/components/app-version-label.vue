<script lang="ts" setup>
import { computed } from 'vue';

import { APP_VERSION, formatAppVersion } from '#/utils/app-version';

defineOptions({ name: 'AppVersionLabel' });

withDefaults(
  defineProps<{
    compact?: boolean;
    corner?: boolean;
  }>(),
  {
    compact: false,
    corner: false,
  },
);

const displayVersion = computed(() => formatAppVersion(APP_VERSION));
</script>

<template>
  <span
    class="app-version-label select-none text-muted-foreground"
    :class="[
      compact || corner ? 'text-xs' : 'text-sm',
      corner &&
        'pointer-events-none fixed bottom-2 right-3 z-40 text-[11px] leading-none opacity-70',
    ]"
    :title="`当前版本 ${displayVersion}`"
  >
    {{ displayVersion }}
  </span>
</template>

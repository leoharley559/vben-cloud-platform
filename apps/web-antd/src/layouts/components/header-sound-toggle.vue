<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

import { Button, Tooltip } from 'ant-design-vue';

import { useHeaderAlertSound } from './use-header-alert-sound';

defineOptions({ name: 'HeaderSoundToggle' });

const { playSound, toggleSound } = useHeaderAlertSound();
</script>

<template>
  <Tooltip :title="playSound ? '关闭语音提示' : '开启语音提示'">
    <Button type="text" size="small" class="header-sound-toggle mr-1" @click="toggleSound">
      <IconifyIcon
        :icon="playSound ? 'lucide:volume-2' : 'lucide:volume-x'"
        class="size-4"
      />
    </Button>
  </Tooltip>
</template>

<style scoped>
.header-sound-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--foreground) / 70%);
}
</style>

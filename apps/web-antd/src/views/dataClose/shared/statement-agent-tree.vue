<script lang="ts" setup>
import type { AgentNode } from '../statement-helpers';

import { Button, Space } from 'ant-design-vue';

defineOptions({ name: 'StatementAgentTree' });

defineProps<{
  agents: AgentNode[];
  path: AgentNode[];
}>();

const emit = defineEmits<{
  drill: [agent: AgentNode];
  jump: [agent: AgentNode, index: number];
}>();
</script>

<template>
  <div class="mb-4 space-y-3 rounded border border-border bg-muted/30 p-3">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <span class="text-muted-foreground">我的账号:</span>
      <Space wrap :size="4">
        <Button
          v-for="(item, index) in path"
          :key="`${item.Id}-${index}`"
          type="link"
          size="small"
          class="px-1"
          @click="emit('jump', item, index)"
        >
          {{ item.Username }}
        </Button>
      </Space>
    </div>
    <div class="flex flex-wrap items-start gap-2 text-sm">
      <span class="mt-1 shrink-0 text-muted-foreground">下级子包网:</span>
      <Space wrap>
        <Button
          v-for="item in agents"
          :key="item.Id"
          size="small"
          @click="emit('drill', item)"
        >
          {{ item.Username }}
        </Button>
        <span v-if="agents.length === 0" class="text-muted-foreground">无</span>
      </Space>
    </div>
  </div>
</template>

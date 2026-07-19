<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Checkbox, Modal, message } from 'ant-design-vue';

import {
  fetchPlayerTagListApi,
  updatePlayerTagApi,
} from '#/api/operationManage/player';

defineOptions({ name: 'PlayerTagModal' });

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{
  playerId?: number | string | null;
  tagId?: string;
}>();
const emit = defineEmits<{ success: [] }>();

const submitting = ref(false);
const checked = ref<Array<number | string>>([]);
const tags = ref<Array<{ Id: number | string; TagName: string }>>([]);

watch(open, async (visible) => {
  if (!visible) {
    return;
  }
  checked.value = props.tagId
    ? props.tagId
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const result = await fetchPlayerTagListApi({ Page: 1, PageSize: 200 });
  tags.value = (result.Items || []) as Array<{
    Id: number | string;
    TagName: string;
  }>;
});

async function handleOk() {
  if (!props.playerId) {
    return;
  }
  submitting.value = true;
  try {
    const names = checked.value.map((id) => {
      const hit = tags.value.find((item) => String(item.Id) === String(id));
      return hit?.TagName || '';
    });
    await updatePlayerTagApi({
      PlayerId: props.playerId,
      TagId: checked.value.join(','),
      TagName: names.join(','),
    });
    message.success('操作成功');
    open.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="玩家标签"
    :confirm-loading="submitting"
    destroy-on-close
    @ok="handleOk"
  >
    <Checkbox.Group v-model:value="checked" class="w-full">
      <div class="flex flex-wrap gap-2">
        <Checkbox
          v-for="item in tags"
          :key="String(item.Id)"
          :value="String(item.Id)"
        >
          {{ item.TagName }}
        </Checkbox>
      </div>
    </Checkbox.Group>
    <div v-if="!tags.length" class="py-6 text-center text-gray-400">
      暂无标签配置
    </div>
  </Modal>
</template>

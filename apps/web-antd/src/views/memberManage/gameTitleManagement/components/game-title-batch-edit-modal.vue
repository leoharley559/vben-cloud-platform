<script lang="ts" setup>
import type { Dayjs } from 'dayjs';
import type { GameTitleBatchEditPayload } from '#/types/game-title';

import { reactive, ref, watch } from 'vue';

import { Form, Modal, Select, message } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

defineOptions({ name: 'GameTitleBatchEditModal' });

const props = defineProps<{
  open: boolean;
  type: 'calTime' | 'vip';
}>();

const emit = defineEmits<{
  confirm: [payload: Omit<GameTitleBatchEditPayload, 'BadgeIds'>];
  'update:open': [value: boolean];
}>();

const submitting = ref(false);
const form = reactive({
  calRange: undefined as [Dayjs, Dayjs] | undefined,
  vip: 0,
});

const vipOptions = Array.from({ length: 11 }, (_, i) => ({
  label: `VIP${i}`,
  value: i,
}));

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    form.calRange = undefined;
    form.vip = 0;
  },
);

function closeModal() {
  emit('update:open', false);
}

async function handleOk() {
  if (props.type === 'calTime') {
    if (!form.calRange?.[0] || !form.calRange?.[1]) {
      message.warning('请选择条件计算时间');
      return;
    }
    emit('confirm', {
      CalEndTime: form.calRange[1].endOf('day').unix(),
      CalStartTime: form.calRange[0].startOf('day').unix(),
      EditType: 2,
    });
    return;
  }
  emit('confirm', {
    EditType: 3,
    Vip: form.vip,
  });
}

defineExpose({
  setSubmitting(value: boolean) {
    submitting.value = value;
  },
});
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    title="批量编辑"
    @cancel="closeModal"
    @ok="handleOk"
  >
    <Form layout="vertical">
      <Form.Item v-if="type === 'calTime'" label="条件计算时间" required>
        <QueryDatetimeRangePicker v-model="form.calRange" />
      </Form.Item>
      <Form.Item v-else label="VIP 等级">
        <div class="flex items-center gap-2">
          <Select v-model:value="form.vip" class="w-40" :options="vipOptions" />
          <span class="text-gray-500">及以上</span>
        </div>
      </Form.Item>
    </Form>
  </Modal>
</template>

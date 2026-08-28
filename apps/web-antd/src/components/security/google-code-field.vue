<script lang="ts" setup>
import { computed } from 'vue';

import { Form, Input } from 'ant-design-vue';

import { checkSecured } from './security-utils';

defineOptions({ name: 'GoogleCodeField' });

const props = withDefaults(
  defineProps<{
    /** 紧凑布局，减小表单项下边距 */
    compact?: boolean;
    label?: string;
    pageId?: number | string;
    value?: string;
  }>(),
  {
    compact: false,
    label: '谷歌验证码',
    pageId: undefined,
    value: '',
  },
);

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const needValidate = computed(() => checkSecured(props.pageId));
</script>

<template>
  <Form.Item
    v-if="needValidate"
    :class="compact ? '!mb-2' : undefined"
    :label="label"
    required
  >
    <Input
      :value="value"
      allow-clear
      :maxlength="6"
      placeholder="请输入6位谷歌验证码"
      @update:value="(v) => emit('update:value', v)"
    />
  </Form.Item>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Form, Input, message, Modal, Switch, Tabs } from 'ant-design-vue';

import { useCloudPlatformStore } from '#/store/cloud-platform';

import {
  createDefaultTagForm,
  resolveDefaultLangGroupId,
  resolveLangGroupIds,
} from './reward-goods-shared';

defineOptions({ name: 'GoodsTagUpsertModal' });

const props = defineProps<{
  mode: 'add' | 'edit';
  tag?: null | Record<string, unknown>;
}>();

const emit = defineEmits<{ submit: [Record<string, unknown>] }>();

const open = defineModel<boolean>('open', { default: false });

const cloudStore = useCloudPlatformStore();
const langGroupIds = computed(() =>
  resolveLangGroupIds(cloudStore.projectConfig),
);
const defaultLangGroupId = computed(() =>
  resolveDefaultLangGroupId(cloudStore.projectConfig),
);

const form = reactive(createDefaultTagForm(langGroupIds.value));
const activeLang = ref(String(defaultLangGroupId.value));

watch(
  () => open.value,
  (visible) => {
    if (!visible) {
      return;
    }
    activeLang.value = String(defaultLangGroupId.value);
    if (props.mode === 'edit' && props.tag) {
      Object.assign(form, structuredClone(props.tag));
    } else {
      Object.assign(form, createDefaultTagForm(langGroupIds.value));
    }
  },
);

function handleOk() {
  for (const lgId of langGroupIds.value) {
    const isDefault = lgId === defaultLangGroupId.value;
    const lang = form.LangText[String(lgId)];
    const active = isDefault || Boolean(lang?.IsActive);
    if (active && !String(lang?.Name || '').trim()) {
      message.warning(`请填写语言组 ${lgId} 的页签名称`);
      activeLang.value = String(lgId);
      return;
    }
  }
  emit('submit', structuredClone(form));
  open.value = false;
}
</script>

<template>
  <Modal
    v-model:open="open"
    destroy-on-close
    :title="mode === 'edit' ? '编辑商品页签' : '新增商品页签'"
    width="560px"
    @ok="handleOk"
  >
    <Tabs v-model:active-key="activeLang" type="line" size="small">
      <Tabs.TabPane
        v-for="lgId in langGroupIds"
        :key="String(lgId)"
        :tab="langGroupIds.length > 1 ? `语言组 ${lgId}` : '基本信息'"
      >
        <Form layout="vertical">
          <Form.Item v-if="lgId !== defaultLangGroupId" label="多语言开关">
            <Switch v-model:checked="form.LangText[String(lgId)]!.IsActive" />
          </Form.Item>
          <Form.Item label="页签名称" required>
            <Input
              v-model:value="form.LangText[String(lgId)]!.Name"
              allow-clear
              placeholder="请输入页签名称"
            />
          </Form.Item>
        </Form>
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { Form, Modal, Select, message } from 'ant-design-vue';

import {
  createPromoterDomainApi,
  fetchDomainListApi,
} from '#/api/promotion/manage';
import type { DomainListItem } from '#/types/promotion';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  currentDomain?: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const loading = ref(false);
const domainOptions = ref<DomainListItem[]>([]);
const selectedDomain = ref<number | string>();

async function loadDomains() {
  const result = await fetchDomainListApi({ Type: 10 });
  domainOptions.value = result.Items || [];
  if (props.currentDomain) {
    const matched = domainOptions.value.find(
      (item) => item.Domain === props.currentDomain,
    );
    selectedDomain.value = matched?.Id || props.currentDomain;
  }
}

async function handleSubmit() {
  if (!selectedDomain.value) {
    message.warning('请选择域名');
    return;
  }
  loading.value = true;
  try {
    await createPromoterDomainApi({ Domain: selectedDomain.value });
    message.success('推广后台域名设置成功');
    open.value = false;
    emit('success');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="loading"
    title="设置推广后台域名"
    @ok="handleSubmit"
    @open="loadDomains"
  >
    <Form layout="vertical">
      <Form.Item label="当前域名">
        <span>{{ currentDomain || '-' }}</span>
      </Form.Item>
      <Form.Item label="选择域名" required>
        <Select
          v-model:value="selectedDomain"
          :options="
            domainOptions.map((item) => ({
              label: item.Domain,
              value: item.Id ?? item.Domain,
            }))
          "
          placeholder="请选择域名"
          show-search
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

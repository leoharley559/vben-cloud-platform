<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Button, Form, Input, message, Result } from 'ant-design-vue';

import {
  fetchOtpConfigApi,
  updateOtpConfigApi,
} from '#/api/memberManage/otp-config';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'OtpManagePanel' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(13_204));

const loading = ref(false);
const saving = ref(false);
const ipLimit = ref('1');
const deviceLimit = ref('10');

async function loadConfig() {
  loading.value = true;
  try {
    const result = await fetchOtpConfigApi();
    const first = Array.isArray(result) ? result[0] : undefined;
    ipLimit.value = String(first?.IpLimit ?? 1);
    deviceLimit.value = String(first?.DeviceLimit ?? 10);
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!/^[1-9]\d*$/.test(ipLimit.value)) {
    message.warning('IP 限制须为正整数');
    return;
  }
  if (!/^\d+$/.test(deviceLimit.value)) {
    message.warning('玩家 OTP 上限须为非负整数');
    return;
  }
  saving.value = true;
  try {
    await updateOtpConfigApi({
      DeviceLimit: deviceLimit.value,
      IpLimit: ipLimit.value,
    });
    message.success('保存成功');
    await loadConfig();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (canView.value) {
    loadConfig();
  }
});
</script>

<template>
  <OpsListPanel v-if="canView">
    <Form class="max-w-xl" layout="vertical">
      <Form.Item label="IP 一分钟内上限（次）">
        <Input v-model:value="ipLimit" :disabled="loading" addon-after="次" />
      </Form.Item>
      <Form.Item label="玩家 OTP 上限（次）">
        <Input
          v-model:value="deviceLimit"
          :disabled="loading"
          addon-after="次"
        />
      </Form.Item>
      <Form.Item>
        <Button :loading="saving" type="primary" @click="handleSave">
          保存
        </Button>
        <Button class="ml-2" :disabled="loading" @click="loadConfig">
          重置
        </Button>
      </Form.Item>
    </Form>
  </OpsListPanel>
  <Result v-else status="403" sub-title="无 OTP 管理权限" title="403" />
</template>

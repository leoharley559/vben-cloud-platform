<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  Checkbox,
  Form,
  Input,
  Modal,
  Radio,
  Spin,
  message,
} from 'ant-design-vue';

import {
  fetchLeaderboardMainConfigApi,
  updateLeaderboardMainConfigApi,
} from '#/api/operationManage/leaderboard';
import { useCloudPlatformStore } from '#/store/cloud-platform';

defineOptions({ name: 'LeaderboardGlobalConfigModal' });

const open = defineModel<boolean>('open', { default: false });

const cloudStore = useCloudPlatformStore();
const loading = ref(false);
const saving = ref(false);

const form = reactive({
  DisplayDevices: [] as string[],
  Id: 0,
  InvalidChannels: '',
  InvalidPackages: '',
  IsGuestDisplay: true,
  ValidChannels: '',
  ValidPackages: '',
});

const deviceOptions = computed(() => {
  const map = cloudStore.projectConfig?.DevicePlatformAll || {};
  const entries = Object.entries(map);
  if (!entries.length) {
    return [
      { label: 'PC', value: '1' },
      { label: 'H5', value: '2' },
      { label: 'Android', value: '3' },
      { label: 'iOS', value: '4' },
    ];
  }
  return entries.map(([value, label]) => ({
    label: String(label),
    value: String(value),
  }));
});

async function loadConfig() {
  loading.value = true;
  try {
    const data = await fetchLeaderboardMainConfigApi();
    if (!data) {
      return;
    }
    form.Id = Number(data.Id || 0);
    form.ValidChannels = String(data.ValidChannels || '');
    form.InvalidChannels = String(data.InvalidChannels || '');
    form.ValidPackages = String(data.ValidPackages || '');
    form.InvalidPackages = String(data.InvalidPackages || '');
    form.IsGuestDisplay = data.IsGuestDisplay !== false;
    const devices = String(data.DisplayDevices || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    form.DisplayDevices = devices.length
      ? devices
      : deviceOptions.value.map((item) => item.value);
  } finally {
    loading.value = false;
  }
}

function buildLangTextPayload() {
  const groups = cloudStore.projectConfig?.LangGroup || [];
  if (!groups.length) {
    return JSON.stringify([{ IsActive: true, LangGroupId: 1 }]);
  }
  return JSON.stringify(
    groups.map((group) => ({
      IsActive: true,
      LangGroupId: group.Id,
    })),
  );
}

async function handleSubmit() {
  if (!form.DisplayDevices.length) {
    message.warning('请至少选择一个展示设备');
    return;
  }
  saving.value = true;
  try {
    await updateLeaderboardMainConfigApi({
      DisplayDevices: form.DisplayDevices.join(','),
      Id: form.Id,
      InvalidChannels: form.InvalidChannels,
      InvalidPackages: form.InvalidPackages,
      IsGuestDisplay: form.IsGuestDisplay,
      LangText: buildLangTextPayload(),
      ValidChannels: form.ValidChannels,
      ValidPackages: form.ValidPackages,
    });
    message.success('保存成功');
    open.value = false;
  } finally {
    saving.value = false;
  }
}

watch(
  () => open.value,
  (visible) => {
    if (visible) {
      void loadConfig();
    }
  },
);
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="saving"
    destroy-on-close
    title="排行榜全局设置"
    width="720px"
    @ok="handleSubmit"
  >
    <Spin :spinning="loading">
      <Form class="mt-2" layout="vertical">
        <Form.Item label="展示设备" required>
          <Checkbox.Group
            v-model:value="form.DisplayDevices"
            :options="deviceOptions"
          />
        </Form.Item>
        <Form.Item label="生效渠道（逗号分隔 ID）">
          <Input
            v-model:value="form.ValidChannels"
            allow-clear
            placeholder="留空表示全部"
          />
        </Form.Item>
        <Form.Item label="屏蔽渠道（逗号分隔 ID）">
          <Input
            v-model:value="form.InvalidChannels"
            allow-clear
            placeholder="可选"
          />
        </Form.Item>
        <Form.Item label="生效包体（逗号分隔 ID）">
          <Input
            v-model:value="form.ValidPackages"
            allow-clear
            placeholder="留空表示全部"
          />
        </Form.Item>
        <Form.Item label="屏蔽包体（逗号分隔 ID）">
          <Input
            v-model:value="form.InvalidPackages"
            allow-clear
            placeholder="可选"
          />
        </Form.Item>
        <Form.Item label="游客展示">
          <Radio.Group v-model:value="form.IsGuestDisplay">
            <Radio :value="true">是</Radio>
            <Radio :value="false">否</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Spin>
  </Modal>
</template>

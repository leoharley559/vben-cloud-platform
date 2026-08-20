<script lang="ts" setup>
import type {
  PlayerAuthSettingItem,
  PlayerAuthVerificationInfoItem,
} from '#/types/player-authentication';

import { onMounted, ref } from 'vue';

import { message, Modal, Switch, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPlayerAuthSettingApi,
  updatePlayerAuthSwitchApi,
} from '#/api/memberManage/player-authentication';
import { formatAuthInfoSwitchType } from '#/utils/player-authentication';

defineOptions({ name: 'AuthInfoSwitchPanel' });

const emit = defineEmits<{ reload: [] }>();

const loading = ref(false);
const list = ref<PlayerAuthVerificationInfoItem[]>([]);

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function parseInfoList(item?: PlayerAuthSettingItem) {
  if (!item) {
    return [];
  }
  const config = item.Config;
  if (Array.isArray(config)) {
    return config as PlayerAuthVerificationInfoItem[];
  }
  if (typeof config === 'string') {
    try {
      const parsed = JSON.parse(config);
      return Array.isArray(parsed)
        ? (parsed as PlayerAuthVerificationInfoItem[])
        : [];
    } catch {
      return [];
    }
  }
  if (config && Array.isArray((config as { Config?: unknown }).Config)) {
    return (config as { Config: PlayerAuthVerificationInfoItem[] }).Config;
  }
  return [];
}

async function loadSetting() {
  loading.value = true;
  try {
    const result = await fetchPlayerAuthSettingApi();
    const item = (result?.Items || []).find((row) => row.SubType === 1005);
    list.value = parseInfoList(item);
  } finally {
    loading.value = false;
  }
}

async function handleSwitchChange(
  row: PlayerAuthVerificationInfoItem,
  checked: boolean | number | string,
) {
  if (!row.VerificationInfo) {
    return;
  }
  const next = Boolean(checked);
  const label = formatAuthInfoSwitchType(row.VerificationInfo);
  Modal.confirm({
    content: `确认${next ? '开启' : '关闭'}「${label}」验证信息？`,
    onCancel: loadSetting,
    onOk: async () => {
      await updatePlayerAuthSwitchApi({
        IsOpen: next ? 1 : 0,
        SubType: 1005,
        VerificationInfo: row.VerificationInfo,
      });
      message.success('操作成功');
      emit('reload');
      await loadSetting();
    },
    title: '开关确认',
  });
}

onMounted(loadSetting);
</script>

<template>
  <div class="mt-8 border-t pt-6">
    <div class="mb-4 font-medium">验证信息开关设置</div>
    <Table
      bordered
      :columns="[
        { dataIndex: 'VerificationInfo', key: 'info', title: '验证信息' },
        { key: 'switch', title: '开关', width: 100 },
        { dataIndex: 'HandlerName', key: 'handler', title: '操作人' },
        { dataIndex: 'HandlerTime', key: 'time', title: '操作时间' },
      ]"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :row-key="(row) => String(row.VerificationInfo)"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'info'">
          {{ formatAuthInfoSwitchType(record.VerificationInfo) }}
        </template>
        <template v-else-if="column.key === 'switch'">
          <Switch
            :checked="Boolean(record.IsOpen)"
            @change="(checked) => handleSwitchChange(record, checked)"
          />
        </template>
        <template v-else-if="column.key === 'time'">
          {{ formatDateTime(record.HandlerTime) }}
        </template>
      </template>
    </Table>
  </div>
</template>

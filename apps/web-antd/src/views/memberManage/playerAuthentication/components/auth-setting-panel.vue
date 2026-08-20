<script lang="ts" setup>
import type {
  PlayerAuthSettingConfig,
  PlayerAuthSettingItem,
} from '#/types/player-authentication';

import { onMounted, ref } from 'vue';

import {
  Button,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPlayerAuthSettingApi,
  updatePlayerAuthSwitchApi,
} from '#/api/memberManage/player-authentication';
import { getServiceImageUrl } from '#/utils/media';
import { formatAuthSettingSubType } from '#/utils/player-authentication';

import AuthInfoSwitchPanel from './auth-info-switch-panel.vue';
import AuthResultEmailPanel from './auth-result-email-panel.vue';
import AuthSettingEditModal from './auth-setting-edit-modal.vue';

defineOptions({ name: 'AuthSettingPanel' });

const loading = ref(false);
const list = ref<PlayerAuthSettingItem[]>([]);
const enableMobileOtp = ref(false);
const enableSameIdSetting = ref(false);
const unverifiedGracePeriod = ref(7);
const editOpen = ref(false);
const editRow = ref<null | PlayerAuthSettingItem>(null);

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

function resolveConfig(config?: PlayerAuthSettingItem['Config']) {
  if (!config) {
    return {} as PlayerAuthSettingConfig;
  }
  if (typeof config === 'string') {
    try {
      return JSON.parse(config) as PlayerAuthSettingConfig;
    } catch {
      return {} as PlayerAuthSettingConfig;
    }
  }
  return config;
}

function parseSettingItems(items: PlayerAuthSettingItem[]) {
  return items.map((item) => {
    const config = resolveConfig(item.Config);
    const exInfoRaw = config.ExInfo;
    const exInfo =
      typeof exInfoRaw === 'string'
        ? exInfoRaw.split(',')
        : (Array.isArray(exInfoRaw)
          ? exInfoRaw
          : ['', '', '', '']);
    return {
      ...item,
      Config: {
        ...config,
        ExInfo: exInfo,
      },
    } as PlayerAuthSettingItem;
  });
}

async function loadSettings() {
  loading.value = true;
  try {
    const result = await fetchPlayerAuthSettingApi();
    const parsed = parseSettingItems(result?.Items || []);
    list.value = parsed.filter((item) => [1, 2, 3, 4].includes(item.SubType));

    const otpConfig = parsed.find((item) => item.SubType === 1001);
    const verifyConfig = parsed.find((item) => item.SubType === 1002);
    const sameIdConfig = parsed.find((item) => item.SubType === 1003);

    enableMobileOtp.value = Boolean(resolveConfig(otpConfig?.Config).IsOpen);
    // Days=0 为合法值，不能用 || 7（否则会误显示成 7）
    const graceDays = resolveConfig(verifyConfig?.Config).Days;
    unverifiedGracePeriod.value =
      graceDays === undefined || graceDays === null ? 7 : Number(graceDays);
    enableSameIdSetting.value = Boolean(
      resolveConfig(sameIdConfig?.Config).IsOpen,
    );
  } finally {
    loading.value = false;
  }
}

async function handleScenarioSwitch(
  checked: boolean | number | string,
  subType: number,
) {
  const next = Boolean(checked);
  const label = formatAuthSettingSubType(subType);
  Modal.confirm({
    content: `确认${next ? '开启' : '关闭'}「${label}」开关？`,
    onCancel: () => {
      loadSettings();
    },
    onOk: async () => {
      await updatePlayerAuthSwitchApi({
        IsOpen: next ? 1 : 0,
        SubType: subType,
      });
      message.success('操作成功');
      await loadSettings();
    },
    title: '开关确认',
  });
}

async function handleExtraSwitch(
  checked: boolean | number | string,
  subType: number,
) {
  const next = Boolean(checked);
  const label = formatAuthSettingSubType(subType);
  Modal.confirm({
    content: `确认${next ? '开启' : '关闭'}「${label}」？`,
    onCancel: () => {
      loadSettings();
    },
    onOk: async () => {
      await updatePlayerAuthSwitchApi({
        IsOpen: next ? 1 : 0,
        SubType: subType,
      });
      message.success('操作成功');
      await loadSettings();
    },
    title: '开关确认',
  });
}

async function saveGracePeriod() {
  await updatePlayerAuthSwitchApi({
    Day: unverifiedGracePeriod.value,
    IsOpen: 1,
    SubType: 1002,
  });
  message.success('保存成功');
  await loadSettings();
}

function openEdit(row: PlayerAuthSettingItem) {
  editRow.value = row;
  editOpen.value = true;
}

function previewImage(path?: string) {
  const url = getServiceImageUrl(path);
  if (url) {
    window.open(url, '_blank');
  }
}

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div>
    <Table
      bordered
      :columns="[
        { dataIndex: 'SubType', key: 'subType', title: '验证场景' },
        { dataIndex: 'switch', key: 'switch', title: '开关' },
        { dataIndex: 'images', key: 'images', title: '示意图' },
        { dataIndex: 'handler', key: 'handler', title: '操作人' },
        { dataIndex: 'time', key: 'time', title: '操作时间' },
        { dataIndex: 'actions', key: 'actions', title: '操作' },
      ]"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="SubType"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'subType'">
          {{ formatAuthSettingSubType(record.SubType) }}
        </template>
        <template v-else-if="column.key === 'switch'">
          <Switch
            :checked="Boolean(resolveConfig(record.Config).IsOpen)"
            @change="(checked) => handleScenarioSwitch(checked, record.SubType)"
          />
        </template>
        <template v-else-if="column.key === 'images'">
          <Space wrap>
            <Button
              v-for="(path, index) in resolveConfig(record.Config).ExInfo || []"
              :key="String(index)"
              :disabled="!path"
              size="small"
              type="link"
              @click="previewImage(path)"
            >
              图{{ Number(index) + 1 }}
            </Button>
          </Space>
        </template>
        <template v-else-if="column.key === 'handler'">
          {{ resolveConfig(record.Config).HandlerName || '-' }}
        </template>
        <template v-else-if="column.key === 'time'">
          {{ formatDateTime(resolveConfig(record.Config).HandlerTime) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button
            size="small"
            type="link"
            @click="openEdit(record as PlayerAuthSettingItem)"
          >
            编辑
          </Button>
        </template>
      </template>
    </Table>

    <div class="mt-2 text-sm text-red-500">
      #
      充值时，提现时，活动里任何一个状态开启时，也会开启游戏里「用户名编辑」需完成身份验证
    </div>

    <div class="mt-6 space-y-4">
      <div class="flex items-center gap-3">
        <span class="w-56 text-sm text-gray-600">手机号 OTP 验证</span>
        <Switch
          :checked="enableMobileOtp"
          @change="(checked) => handleExtraSwitch(checked, 1001)"
        />
      </div>
      <div class="flex items-center gap-3">
        <span class="w-56 text-sm text-gray-600">注册后限定时间内完成验证</span>
        <InputNumber
          v-model:value="unverifiedGracePeriod"
          :min="0"
          addon-after="天"
          class="w-40"
        />
        <Button type="primary" @click="saveGracePeriod">保存</Button>
      </div>
    </div>

    <AuthSettingEditModal
      v-model:open="editOpen"
      :row="editRow"
      @success="loadSettings"
    />

    <!-- 对齐旧站顺序：验证信息开关 → 同证件校验 → 结果通知邮件 -->
    <AuthInfoSwitchPanel @reload="loadSettings" />

    <div class="mt-8 border-t pt-6">
      <div class="mb-3 font-medium">同姓名校验设置</div>
      <div class="flex items-center gap-3">
        <span class="w-56 text-sm text-gray-600">同证件 ID 唯一校验</span>
        <Switch
          :checked="enableSameIdSetting"
          @change="(checked) => handleExtraSwitch(checked, 1003)"
        />
      </div>
    </div>

    <AuthResultEmailPanel @reload="loadSettings" />
  </div>
</template>

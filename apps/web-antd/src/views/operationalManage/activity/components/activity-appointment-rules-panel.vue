<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Descriptions, Spin, Tag } from 'ant-design-vue';

import { fetchReserveWithdrawActivityApi } from '#/api/operationManage/activity';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { parseJsonArray } from '#/utils/activity-manage';

defineOptions({ name: 'ActivityAppointmentRulesPanel' });

interface OpenTimeRow {
  BeginTime?: number | string;
  EndTime?: number | string;
}

interface SettingRow {
  Hour?: number | string;
  MaxAmount?: number | string;
  Rate?: number | string;
}

const { checkPermission } = useCloudPermission();
const canView = checkPermission(11_911);

const loading = ref(false);
const config = ref<Record<string, unknown>>({});
const openTimes = ref<OpenTimeRow[]>([]);
const settings = ref<SettingRow[]>([]);

function formatTime(value?: number | string) {
  if (!value) return '-';
  const numeric = Number(value);
  const hours = Math.floor(numeric / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((numeric % 3600) / 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}`;
}

async function loadConfig() {
  if (!canView) return;
  loading.value = true;
  try {
    const data = await fetchReserveWithdrawActivityApi();
    config.value = (data || {}) as Record<string, unknown>;
    openTimes.value = parseJsonArray<OpenTimeRow>(config.value.OpenTime);
    settings.value = parseJsonArray<SettingRow>(config.value.Setting);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadConfig();
});
</script>

<template>
  <Spin :spinning="loading">
    <div v-if="!canView" class="py-8 text-center text-gray-400">
      无预约取款规则查看权限 (11911)
    </div>
    <template v-else>
      <Descriptions bordered class="mb-4" size="small" :column="2">
        <Descriptions.Item label="活动开关">
          <Tag :color="Number(config.Switch) === 1 ? 'success' : 'default'">
            {{ Number(config.Switch) === 1 ? '开启' : '关闭' }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="规则说明">
          开放时间 {{ openTimes.length }} 段 · 参数 {{ settings.length }} 条
        </Descriptions.Item>
      </Descriptions>

      <div class="mb-4">
        <div class="mb-2 font-medium">开放时间</div>
        <div v-if="openTimes.length === 0" class="text-sm text-gray-400">
          暂无配置
        </div>
        <ul v-else class="list-disc pl-5 text-sm">
          <li v-for="(item, index) in openTimes" :key="index">
            {{ formatTime(item.BeginTime) }} - {{ formatTime(item.EndTime) }}
          </li>
        </ul>
      </div>

      <div>
        <div class="mb-2 font-medium">参数设置</div>
        <div v-if="settings.length === 0" class="text-sm text-gray-400">
          暂无配置
        </div>
        <ul v-else class="list-disc pl-5 text-sm">
          <li v-for="(item, index) in settings" :key="index">
            时长 {{ item.Hour }}h · 加送 {{ item.Rate }}% · 上限
            {{ item.MaxAmount }}
          </li>
        </ul>
      </div>

      <div class="mt-4 text-xs text-gray-400">
        规则编辑向导尚未迁移；当前为 GET /backend/reservewithdrawactivity
        只读展示。
      </div>
    </template>
  </Spin>
</template>

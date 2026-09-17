<script lang="ts" setup>
import type { AccountLoginLogItem } from '#/api/core/account-login';

import { computed, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Empty, message, Table, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchAccountLoginLogListApi } from '#/api/core/account-login';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

const loading = ref(false);
const tableData = ref<AccountLoginLogItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const latest = computed(() =>
  page.value === 1 && tableData.value.length > 0 ? tableData.value[0] : null,
);

const columns = [
  {
    customRender: ({ index }: { index: number }) =>
      (page.value - 1) * pageSize.value + index + 1,
    key: 'index',
    title: '#',
    width: 64,
  },
  {
    dataIndex: 'CreateTime',
    key: 'CreateTime',
    title: '登录时间',
    width: 220,
  },
  {
    dataIndex: 'Ip',
    key: 'Ip',
    title: '登录 IP',
    width: 180,
  },
  {
    dataIndex: 'Address',
    key: 'Address',
    title: '登录地址',
  },
];

function parseTime(value?: number | string) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return dayjs(String(value));
  return dayjs(String(value).length > 10 ? numeric : numeric * 1000);
}

function formatDateTime(value?: number | string) {
  const date = parseTime(value);
  return date?.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '-';
}

function formatRelative(value?: number | string) {
  const date = parseTime(value);
  if (!date?.isValid()) return '';
  const now = dayjs();
  const minutes = now.diff(date, 'minute');
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = now.diff(date, 'hour');
  if (hours < 24) return `${hours} 小时前`;
  const days = now.diff(date, 'day');
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return date.format('MM-DD');
}

function isLatestRow(index: number) {
  return page.value === 1 && index === 0;
}

async function loadData(nextPage = page.value, nextSize = pageSize.value) {
  loading.value = true;
  try {
    const result = await fetchAccountLoginLogListApi({
      Page: nextPage,
      PageSize: nextSize,
    });
    const items = result?.Item || result?.Items || [];
    tableData.value = items.map((item, index) => ({
      ...item,
      _rowKey: `${item.Ip || ''}-${item.CreateTime || ''}-${index}`,
    }));
    total.value = Number(result?.Pagination?.MaxCount || items.length || 0);
    page.value = nextPage;
    pageSize.value = nextSize;
  } catch {
    message.error('加载登录记录失败');
  } finally {
    loading.value = false;
  }
}

function handleTableChange(pagination: {
  current?: number;
  pageSize?: number;
}) {
  void loadData(pagination.current || 1, pagination.pageSize || pageSize.value);
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="mb-5">
      <div class="text-lg font-semibold">登录记录</div>
      <p class="mt-1 text-sm text-muted-foreground">
        查看近期登录时间、IP 与地点。若出现陌生地点，请及时修改密码并检查登录安全设置。
      </p>
    </div>

    <div
      v-if="latest"
      class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-accent/40 px-4 py-3"
    >
      <div class="flex min-w-0 items-start gap-3">
        <div
          class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <IconifyIcon class="size-4" icon="lucide:shield-check" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium">最近一次登录</span>
            <Tag color="processing">{{ formatRelative(latest.CreateTime) }}</Tag>
          </div>
          <div class="mt-1 text-sm text-muted-foreground">
            {{ formatDateTime(latest.CreateTime) }}
          </div>
        </div>
      </div>
      <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span class="inline-flex items-center gap-1.5">
          <IconifyIcon class="size-3.5 text-muted-foreground" icon="lucide:globe" />
          <code class="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
            {{ latest.Ip || '-' }}
          </code>
        </span>
        <span class="inline-flex min-w-0 items-center gap-1.5">
          <IconifyIcon
            class="size-3.5 shrink-0 text-muted-foreground"
            icon="lucide:map-pin"
          />
          <span class="truncate">{{ latest.Address || '未知地点' }}</span>
        </span>
      </div>
    </div>

    <Table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        pageSizeOptions: TABLE_ANT_PAGE_SIZE_OPTIONS,
        showQuickJumper: true,
        showSizeChanger: true,
        showTotal: (count: number) => `共 ${count} 条`,
        total,
      }"
      :row-class-name="(_row: AccountLoginLogItem, index: number) =>
        isLatestRow(index) ? 'login-log-latest-row' : ''
      "
      :scroll="{ x: 720 }"
      :locale="{ emptyText: '暂无登录记录' }"
      class="login-log-table"
      row-key="_rowKey"
      size="middle"
      @change="handleTableChange"
    >
      <template #emptyText>
        <Empty description="暂无登录记录" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
      </template>
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'CreateTime'">
          <div class="flex items-center gap-2">
            <div>
              <div class="font-medium leading-5">
                {{ formatDateTime(record.CreateTime) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ formatRelative(record.CreateTime) }}
              </div>
            </div>
            <Tag v-if="isLatestRow(index)" class="m-0" color="processing">
              最近
            </Tag>
          </div>
        </template>
        <template v-else-if="column.key === 'Ip'">
          <code
            class="rounded-md bg-accent px-2 py-0.5 font-mono text-[13px] text-foreground"
          >
            {{ record.Ip || '-' }}
          </code>
        </template>
        <template v-else-if="column.key === 'Address'">
          <span class="inline-flex max-w-full items-center gap-1.5">
            <IconifyIcon
              class="size-3.5 shrink-0 text-muted-foreground"
              icon="lucide:map-pin"
            />
            <span class="truncate">{{ record.Address || '未知地点' }}</span>
          </span>
        </template>
      </template>
    </Table>
  </div>
</template>

<style scoped>
.login-log-table :deep(.ant-table) {
  background: transparent;
}

.login-log-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  background: hsl(var(--accent) / 55%);
}

.login-log-table :deep(.login-log-latest-row > td) {
  background: hsl(var(--primary) / 6%);
}

.login-log-table :deep(.ant-table-tbody > tr:hover > td) {
  background: hsl(var(--accent) / 70%);
}
</style>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { EmailVerifyCodeListItem } from '#/types/email-verify-code';

import { computed, ref } from 'vue';

import { Button, Input, Result, Select, Space, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchEmailVerifyCodeListApi } from '#/api/memberManage/email-verify-code';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'EmailCodeQueryList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canView = computed(() => checkPermission(13011));

const filterLoginAccount = ref('');
const filterEmailAccount = ref('');
const filterPackageId = ref<number | string>('');
const loading = ref(false);

const packageSelectOptions = computed(() => [
  { label: '全部', value: '' as number | string },
  ...packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
]);

const packageNameMap = computed(() => {
  const map = new Map<string, string>();
  packageOptions.value.forEach((item) => {
    if (item.PackageId !== '' && item.PackageId !== undefined) {
      map.set(String(item.PackageId), item.PackageName || '');
    }
  });
  return map;
});

function normalizeLoginAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
}

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

function resolvePackageName(row: EmailVerifyCodeListItem) {
  if (row.PackageName) {
    return row.PackageName;
  }
  return packageNameMap.value.get(String(row.PackageId ?? '')) || '-';
}

const gridOptions: VxeTableGridOptions<EmailVerifyCodeListItem> = {
  columns: [
    {
      field: 'HandlerTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    { field: 'EmailAccount', minWidth: 180, title: '邮箱' },
    { field: 'LoginAccount', minWidth: 130, title: '游戏账号' },
    {
      field: 'PackageName',
      formatter: ({ row }) => resolvePackageName(row),
      minWidth: 120,
      title: '所属产品',
    },
    { field: 'VerifyCode', minWidth: 100, title: '验证码' },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async () => ({ items: [], total: 0 }),
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function normalizeEmailList(result: unknown): EmailVerifyCodeListItem[] {
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === 'object') {
    const items = (result as { Items?: EmailVerifyCodeListItem[] }).Items;
    if (Array.isArray(items)) {
      return items;
    }
  }
  return [];
}

async function handleSearch() {
  const hasAccount = Boolean(filterLoginAccount.value.trim());
  const hasEmail = Boolean(filterEmailAccount.value.trim());
  if (!hasAccount && !hasEmail) {
    message.warning('请至少输入游戏账号或邮箱');
    return;
  }
  loading.value = true;
  try {
    const result = await fetchEmailVerifyCodeListApi({
      EmailAccount: filterEmailAccount.value.trim() || undefined,
      LoginAccount:
        normalizeLoginAccount(filterLoginAccount.value) || undefined,
      PackageId:
        filterPackageId.value === '' ? undefined : filterPackageId.value,
    });
    const rows = normalizeEmailList(result);
    await gridApi.grid?.loadData(rows);
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  filterLoginAccount.value = '';
  filterEmailAccount.value = '';
  filterPackageId.value = '';
  gridApi.grid?.loadData([]);
}
</script>

<template>
  <OpsListPanel v-if="canView">
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="请输入"
          style="width: 240px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">产品</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
          :options="packageSelectOptions"
          placeholder="全部产品"
          style="width: 160px"
        />
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterEmailAccount"
          allow-clear
          placeholder="请输入"
          style="width: 250px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>邮箱</template>
        </Input>
      </div>
      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </template>

    <Grid />
  </OpsListPanel>
  <Result v-else status="403" sub-title="无邮箱验证码查询权限" title="403" />
</template>

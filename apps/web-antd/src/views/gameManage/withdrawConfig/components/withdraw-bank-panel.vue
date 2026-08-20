<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import {
  Button,
  message,
  Modal,
  Result,
  Space,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProjectConfigApi } from '#/api';
import {
  batchUpdateWithdrawBankApi,
  fetchWithdrawBankListApi,
  updateWithdrawBankSwitchApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'WithdrawBankPanel' });

interface BankRow {
  BankCode?: string;
  BankName?: string;
  IsOpen?: number;
  Key: number | string;
  Name?: string;
}

const { checkPermission } = useCloudPermission();
const canViewTable = computed(() => checkPermission(10_985));
const canSwitch = computed(() => checkPermission(10_986));
const canBatchOpen = computed(() => checkPermission(13_210));
const canBatchClose = computed(() => checkPermission(13_338));

const actionId = ref<number | string>();
const selectedRows = ref<BankRow[]>([]);
const batchLoading = ref(false);

const selectedKeys = computed(() =>
  selectedRows.value
    .map((row) => row.Key)
    .filter(Boolean)
    .join(','),
);

const gridOptions: VxeTableGridOptions<BankRow> = {
  checkboxConfig: {},
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'IsOpen',
      minWidth: 100,
      slots: { default: 'isOpen' },
      title: '开关',
    },
    { field: 'BankCode', minWidth: 120, title: '银行代码' },
    {
      field: 'BankName',
      formatter: ({ row }) => String(row.BankName || row.Name || '-'),
      minWidth: 160,
      title: '银行名称',
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const result = await fetchWithdrawBankListApi();
        const items = (result?.Items ||
          (Array.isArray(result) ? result : [])) as unknown as BankRow[];
        return {
          items,
          total: items.length,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: BankRow[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: BankRow[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

function isOn(row: BankRow) {
  return Number(row.IsOpen) === 1;
}

function handleSwitch(row: BankRow, checked: boolean) {
  const next = checked ? 1 : 2;
  const prev = isOn(row) ? 1 : 2;
  Modal.confirm({
    content: `确认${checked ? '开启' : '关闭'}银行「${row.BankName || row.Name || row.BankCode}」？`,
    onCancel: () => {
      row.IsOpen = prev;
    },
    onOk: async () => {
      actionId.value = row.Key;
      try {
        await updateWithdrawBankSwitchApi({ IsOpen: next, Key: row.Key });
        await getProjectConfigApi();
        row.IsOpen = next;
        message.success('操作成功');
      } catch {
        row.IsOpen = prev;
      } finally {
        actionId.value = undefined;
      }
    },
    title: '提示',
  });
}

function handleBatch(isOpen: number) {
  if (!selectedKeys.value) {
    message.warning('请先选择银行');
    return;
  }
  Modal.confirm({
    content: `确认批量${isOpen === 1 ? '开启' : '关闭'}选中银行？`,
    title: '批量操作',
    onOk: async () => {
      batchLoading.value = true;
      try {
        await batchUpdateWithdrawBankApi({
          IsOpen: isOpen,
          Keys: selectedKeys.value,
        });
        await getProjectConfigApi();
        message.success('批量操作成功');
        selectedRows.value = [];
        gridApi.reload();
      } finally {
        batchLoading.value = false;
      }
    },
  });
}
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-3 flex flex-wrap gap-2">
      <Button
        v-if="canBatchOpen"
        :disabled="!selectedKeys"
        :loading="batchLoading"
        type="primary"
        @click="handleBatch(1)"
      >
        批量开启
      </Button>
      <Button
        v-if="canBatchClose"
        :disabled="!selectedKeys"
        :loading="batchLoading"
        danger
        @click="handleBatch(2)"
      >
        批量关闭
      </Button>
      <Space>
        <Button @click="gridApi.reload()">刷新</Button>
      </Space>
    </div>
    <Grid>
      <template #isOpen="{ row }">
        <Switch
          v-if="canSwitch"
          :checked="isOn(row)"
          :loading="actionId === row.Key"
          checked-children="开"
          un-checked-children="关"
          @change="(checked) => handleSwitch(row, !!checked)"
        />
        <Tag v-else :color="isOn(row) ? 'success' : 'default'">
          {{ isOn(row) ? '开启' : '关闭' }}
        </Tag>
      </template>
    </Grid>
  </div>
  <Result
    v-else
    status="403"
    sub-title="需要权限 10985 才能查看出款银行"
    title="无权限"
  />
</template>

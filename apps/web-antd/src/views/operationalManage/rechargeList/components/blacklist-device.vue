<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RechargeBlackDeviceItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import { Button, Input, Modal, Result, Space, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteRechargeBlackDeviceApi,
  fetchRechargeBlackDeviceListApi,
} from '#/api/operationManage/recharge-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useRechargePayTypeOptions } from '#/utils/recharge-pay-type';

import RechargeBlackDeviceModal from './recharge-black-device-modal.vue';

defineOptions({ name: 'BlacklistDevice' });

const { checkPermission } = useCloudPermission();
const { formatPayTypes } = useRechargePayTypeOptions();

const canViewTable = computed(() => checkPermission(10293));
const canCreate = computed(() => checkPermission(10294));
const canBatchDelete = computed(() => checkPermission(10295));
const canEdit = computed(() => checkPermission(10296));
const canDelete = computed(() => checkPermission(10297));

const filterDeviceId = ref('');
const selectedRows = ref<RechargeBlackDeviceItem[]>([]);
const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const editingRow = ref<RechargeBlackDeviceItem | null>(null);

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

function openCreate() {
  formMode.value = 'create';
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: RechargeBlackDeviceItem) {
  formMode.value = 'edit';
  editingRow.value = row;
  formOpen.value = true;
}

const gridOptions: VxeTableGridOptions<RechargeBlackDeviceItem> = {
  checkboxConfig: { reserve: true },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '添加时间',
    },
    {
      field: 'DeviceId',
      minWidth: 200,
      showOverflow: 'tooltip',
      title: '设备号',
    },
    { field: 'Operator', minWidth: 120, title: '添加人员' },
    {
      field: 'PayType',
      formatter: ({ cellValue }) => formatPayTypes(String(cellValue || '')),
      minWidth: 160,
      title: '允许充值方式',
    },
    { field: 'Remark', minWidth: 140, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRechargeBlackDeviceListApi({
          DeviceId: filterDeviceId.value,
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: RechargeBlackDeviceItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: RechargeBlackDeviceItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});
const loading = computed(() => gridApi.grid?.loading ?? false);
const hasSelection = computed(() => selectedRows.value.length > 0);

function handleDelete(row: RechargeBlackDeviceItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '确认删除该设备黑名单？',
    onOk: async () => {
      await deleteRechargeBlackDeviceApi(
        row.Id!,
        String(row.DisableLoginPlayer ?? ''),
      );
      message.success('删除成功');
      gridApi.reload();
    },
    title: '删除确认',
  });
}

function handleBatchDelete() {
  if (!hasSelection.value) {
    message.warning('请先选择记录');
    return;
  }
  Modal.confirm({
    content: `确认删除已选 ${selectedRows.value.length} 条记录？`,
    onOk: async () => {
      await Promise.all(
        selectedRows.value.map((row) =>
          deleteRechargeBlackDeviceApi(
            row.Id!,
            String(row.DisableLoginPlayer ?? ''),
          ),
        ),
      );
      message.success('批量删除成功');
      selectedRows.value = [];
      gridApi.reload();
    },
    title: '批量删除',
  });
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterDeviceId"
          allow-clear
          @press-enter="gridApi.reload()"
          placeholder="请输入设备号"
        >
          <template #addonBefore>设备号</template>
        </Input>
      </div>
        <div class="query-filter-actions">
          <Space wrap>
        <Button :loading="loading" type="primary" @click="gridApi.reload()">
          查询
        </Button>
        <Button v-if="canCreate" type="primary" @click="openCreate">
          手动添加
        </Button>
        <Button
          v-if="canBatchDelete"
          danger
          :disabled="!hasSelection"
          @click="handleBatchDelete"
        >
          批量删除
        </Button>
      </Space>
        </div>
    </div>
  </div>

    <Grid>
      <template #actions="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <RechargeBlackDeviceModal
      v-model:open="formOpen"
      :mode="formMode"
      :row="editingRow"
      @success="gridApi.reload()"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10293 才能查看设备号黑名单"
    title="无权限"
  />
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RechargeBlackPlayerItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Result,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteRechargeBlackPlayerApi,
  fetchRechargeBlackPlayerListApi,
} from '#/api/operationManage/recharge-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useRechargePayTypeOptions } from '#/utils/recharge-pay-type';

import RechargeBlackPlayerModal from './recharge-black-player-modal.vue';

defineOptions({ name: 'BlacklistGameAccount' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const { formatPayTypes } = useRechargePayTypeOptions();

const canViewTable = computed(() => checkPermission(10285));
const canCreate = computed(() => checkPermission(10288));
const canAutoConfig = computed(() => checkPermission(10289));
const canBatchDelete = computed(() => checkPermission(10290));
const canEdit = computed(() => checkPermission(10291));
const canDelete = computed(() => checkPermission(10292));

const selectedIds = ref<string[]>([]);

const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterDeviceId = ref('');
/** 对齐旧站 gameAccount：首屏 BeginTime/EndTime 为空，不默认昨日 */
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const formOpen = ref(false);
const formMode = ref<'auto' | 'create' | 'edit'>('create');
const editingRow = ref<RechargeBlackPlayerItem | null>(null);

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

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : '',
    DeviceId: filterDeviceId.value,
    EndTime: end ? end.endOf('day').unix() : '',
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value || '',
  };
}

function openCreate() {
  formMode.value = 'create';
  editingRow.value = null;
  formOpen.value = true;
}

function openAuto() {
  formMode.value = 'auto';
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: RechargeBlackPlayerItem) {
  formMode.value = 'edit';
  editingRow.value = row;
  formOpen.value = true;
}

const gridOptions: VxeTableGridOptions<RechargeBlackPlayerItem> = {
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
      field: 'ProhibitedTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '禁止日期',
    },
    { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'PayType',
      formatter: ({ cellValue }) => formatPayTypes(String(cellValue || '')),
      minWidth: 160,
      title: '允许充值方式',
    },
    {
      field: 'RegTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '注册时间',
    },
    { field: 'Recharged', minWidth: 110, title: '累计充值' },
    { field: 'Operator', minWidth: 120, title: '添加人员' },
    {
      field: 'DeviceId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '设备号',
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
        const result = await fetchRechargeBlackPlayerListApi({
          ...getQueryParams(),
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
    checkboxAll: ({ records }: { records: RechargeBlackPlayerItem[] }) => {
      selectedIds.value = records
        .map((row) => String(row.Id || ''))
        .filter(Boolean);
    },
    checkboxChange: ({ records }: { records: RechargeBlackPlayerItem[] }) => {
      selectedIds.value = records
        .map((row) => String(row.Id || ''))
        .filter(Boolean);
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);

function handleDelete(id?: number | string) {
  if (!id) {
    return;
  }
  Modal.confirm({
    content: '确认删除该黑名单记录？',
    onOk: async () => {
      await deleteRechargeBlackPlayerApi(id);
      message.success('删除成功');
      gridApi.reload();
    },
    title: '删除确认',
  });
}

function handleBatchDelete() {
  if (!selectedIds.value.length) {
    message.warning('请先选择记录');
    return;
  }
  Modal.confirm({
    content: `确认删除已选 ${selectedIds.value.length} 条记录？`,
    onOk: async () => {
      await Promise.all(
        selectedIds.value.map((id) => deleteRechargeBlackPlayerApi(id)),
      );
      message.success('批量删除成功');
      selectedIds.value = [];
      gridApi.reload();
    },
    title: '批量删除',
  });
}

function handleReset() {
  filterLoginAccount.value = '';
  filterPackageId.value = '';
  filterDeviceId.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

onMounted(() => {
  // 对齐旧站：PackageId 默认空（全部产品），勿自动选中首个产品
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 200px"
        @press-enter="gridApi.reload()"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
      <Select
        v-model:value="filterPackageId"
        :options="[
          { label: '全部产品', value: '' },
          ...packageOptions
            .filter((item) => item.PackageId !== '')
            .map((item) => ({
              label: item.PackageName,
              value: item.PackageId,
            })),
        ]"
        allow-clear
        placeholder="全部产品"
        style="width: 160px"
      />
      <Input
        v-model:value="filterDeviceId"
        allow-clear
        placeholder="设备号"
        style="width: 200px"
      >
        <template #addonBefore>设备号</template>
      </Input>
      <DatePicker.RangePicker
        v-model:value="filterDateRange"
        allow-clear
      />
      <Space wrap>
        <Button :loading="loading" type="primary" @click="gridApi.reload()">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button v-if="canCreate" type="primary" @click="openCreate">
          手动添加
        </Button>
        <Button v-if="canAutoConfig" @click="openAuto">自动条件设置</Button>
        <Button
          v-if="canBatchDelete"
          danger
          :disabled="!selectedIds.length"
          @click="handleBatchDelete"
        >
          批量删除
        </Button>
      </Space>
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
            @click="handleDelete(row.Id)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <RechargeBlackPlayerModal
      v-model:open="formOpen"
      :mode="formMode"
      :row="editingRow"
      @success="gridApi.reload()"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10285 才能查看游戏账号黑名单"
    title="无权限"
  />
</template>

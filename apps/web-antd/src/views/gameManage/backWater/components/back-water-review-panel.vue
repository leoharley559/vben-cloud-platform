<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportBackWaterRecordApi,
  fetchBackWaterRecordApi,
  fetchBackWaterReviewApi,
  fetchBackWaterSchemesApi,
  reviewBackWaterApi,
} from '#/api/gameManage/back-water';
import { fetchPlayerLevelListApi } from '#/api/operationManage/player-level';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'BackWaterReviewPanel' });

type ReviewMode = 'manual' | 'system';
interface ReviewRow {
  ApplyBackWater?: number;
  AwardDesc?: string;
  AwardTime?: number | string;
  BackWater?: number;
  ChannelId?: number | string;
  ChannelName?: string;
  ConfigName?: string;
  CreateTime?: number | string;
  Id: number | string;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  RebateMode?: number;
  Reject?: number;
  ReviewStatus?: number;
  VipLevel?: number;
}

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const canSystem = computed(() => checkPermission(12_662));
const canManual = computed(() => checkPermission(12_668));
const mode = ref<ReviewMode>(canSystem.value ? 'system' : 'manual');
const schemes = ref<Array<Record<string, unknown>>>([]);
const levels = ref<Array<Record<string, unknown>>>([]);
const dateRange = ref<[Dayjs, Dayjs]>([
  dayjs().startOf('day'),
  dayjs().endOf('day'),
]);
const filters = reactive({
  AdminName: '',
  ApplyMax: undefined as number | undefined,
  ApplyMin: undefined as number | undefined,
  ChannelIds: [] as Array<number | string>,
  ConfigId: '' as number | string,
  LevelId: -1 as number | string,
  LoginAccount: '',
  OrderId: '',
  PackId: '' as number | string,
  RebateMode: -1,
  VipLevel: -1,
});
const selected = ref<ReviewRow[]>([]);
const actionLoading = ref(false);
const approveVisible = ref(false);
const rejectVisible = ref(false);
const actionRows = ref<ReviewRow[]>([]);
const approveAmount = ref<number>();
const rejectDesc = ref('');
const exportVisible = ref(false);
const exportCode = ref('');

const canSystemList = computed(() => checkPermission(12_663));
const canSystemBatchApprove = computed(() => checkPermission(12_664));
const canSystemBatchReject = computed(() => checkPermission(12_665));
const canSystemApprove = computed(() => checkPermission(12_666));
const canSystemReject = computed(() => checkPermission(12_667));
const canSystemExport = computed(() => checkPermission(12_674));
const canManualList = computed(() => checkPermission(12_669));
const canManualBatchApprove = computed(() => checkPermission(12_670));
const canManualBatchReject = computed(() => checkPermission(12_671));
const canManualApprove = computed(() => checkPermission(12_672));
const canManualReject = computed(() => checkPermission(12_673));
const canBatchApprove = computed(() =>
  mode.value === 'system'
    ? canSystemBatchApprove.value
    : canManualBatchApprove.value,
);
const canBatchReject = computed(() =>
  mode.value === 'system'
    ? canSystemBatchReject.value
    : canManualBatchReject.value,
);

const packageOptionsList = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);
const schemeOptions = computed(() => [
  { label: '全部方案', value: '' },
  ...schemes.value.map((item) => ({
    label: String(item.Name || item.Id),
    value: item.Id as number | string,
  })),
]);
const levelOptions = computed(() => [
  { label: '全部层级', value: -1 },
  ...levels.value.map((item) => ({
    label: String(item.LevelName || item.Id),
    value: item.Id as number | string,
  })),
]);
const vipOptions = computed(() => [
  { label: '全部 VIP', value: -1 },
  ...Array.from({ length: 11 }, (_, index) => ({
    label: `VIP${index}`,
    value: index,
  })),
]);

function pending(row: ReviewRow) {
  return mode.value === 'system'
    ? Number(row.Reject) === 2
    : Number(row.ReviewStatus) === 0;
}

function reviewState(row: ReviewRow) {
  const value =
    mode.value === 'system' ? Number(row.Reject) : Number(row.ReviewStatus);
  if (mode.value === 'system') {
    if (value === 1) return '已通过';
    if (value === 3) return '已拒绝';
  } else {
    if (value === 1) return '已通过';
    if (value === 2) return '已拒绝';
  }
  return '待审核';
}

function queryParams(page: { currentPage: number; pageSize: number }) {
  const common = {
    BeginTime: dateRange.value?.[0]?.unix() || '',
    ChannelIds: filters.ChannelIds.join(','),
    EndTime: dateRange.value?.[1]?.unix() || '',
    LoginAccount: filters.LoginAccount.trim().toLowerCase(),
    OrderId: filters.OrderId.trim(),
    Page: page.currentPage,
    PageSize: page.pageSize,
    VipLevel: filters.VipLevel,
  };
  if (mode.value === 'system') {
    return {
      ...common,
      AdminName: filters.AdminName.trim(),
      AwardStatus: -1,
      AwardType: -1,
      ConfigId: filters.ConfigId,
      LevelId: filters.LevelId,
      PackId: filters.PackId,
      RebateMode: filters.RebateMode,
      Reject: 1,
      Sum: 1,
    };
  }
  return {
    ...common,
    ApplyMax:
      filters.ApplyMax === undefined ? '' : Math.round(filters.ApplyMax * 100),
    ApplyMin:
      filters.ApplyMin === undefined ? '' : Math.round(filters.ApplyMin * 100),
    PackageId: filters.PackId,
  };
}

const systemColumns: VxeTableGridOptions<ReviewRow>['columns'] = [
  { type: 'checkbox', width: 50 },
  { field: 'OrderId', minWidth: 190, title: '订单号' },
  {
    field: 'LoginAccount',
    minWidth: 120,
    slots: { default: 'loginAccount' },
    title: '游戏账号',
  },
  {
    field: 'VipLevel',
    formatter: ({ cellValue }) => `VIP${cellValue ?? '-'}`,
    width: 90,
    title: 'VIP 等级',
  },
  { field: 'LevelName', minWidth: 110, title: '玩家层级' },
  {
    field: 'AdminName',
    minWidth: 110,
    slots: { default: 'adminName' },
    title: '代理账号',
  },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  {
    field: 'ChannelName',
    formatter: ({ row }) =>
      `${row.ChannelName || '-'}(${row.ChannelId || '-'})`,
    minWidth: 140,
    title: '所属渠道',
  },
  { field: 'ConfigName', minWidth: 120, title: '返水方案' },
  {
    field: 'BackWater',
    formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
    minWidth: 110,
    title: '返水金额',
  },
  {
    field: 'CreateTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string),
    minWidth: 170,
    title: '生成时间',
  },
  {
    field: 'AwardTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string),
    minWidth: 170,
    title: '发放时间',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 160,
  },
];

const manualColumns: VxeTableGridOptions<ReviewRow>['columns'] = [
  { type: 'checkbox', width: 50 },
  { field: 'OrderId', minWidth: 190, title: '订单号' },
  {
    field: 'LoginAccount',
    minWidth: 120,
    slots: { default: 'loginAccount' },
    title: '游戏账号',
  },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  {
    field: 'ChannelName',
    formatter: ({ row }) =>
      `${row.ChannelName || '-'}(${row.ChannelId || '-'})`,
    minWidth: 140,
    title: '所属渠道',
  },
  {
    field: 'VipLevel',
    formatter: ({ cellValue }) => `VIP${cellValue ?? '-'}`,
    width: 90,
    title: 'VIP 等级',
  },
  {
    field: 'ApplyBackWater',
    formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
    minWidth: 110,
    title: '申请金额',
  },
  { field: 'AwardDesc', minWidth: 150, title: '申请原因' },
  {
    field: 'BackWater',
    formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
    minWidth: 110,
    title: '实际发放',
  },
  {
    field: 'AwardTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string),
    minWidth: 170,
    title: '发放时间',
  },
  {
    field: 'CreateTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string),
    minWidth: 170,
    title: '生成时间',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 180,
  },
];

const gridOptions: VxeTableGridOptions<ReviewRow> = {
  checkboxConfig: { checkMethod: ({ row }) => pending(row as ReviewRow) },
  columns: systemColumns,
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const allowed =
          mode.value === 'system' ? canSystemList.value : canManualList.value;
        if (!allowed) return { items: [], total: 0 };
        const result =
          mode.value === 'system'
            ? await fetchBackWaterRecordApi(queryParams(page))
            : await fetchBackWaterReviewApi(queryParams(page));
        const items = (result.Items || []) as unknown as ReviewRow[];
        return {
          items,
          total: Number(
            result.Pagination?.MaxCount ??
              result.Count ??
              result.Total ??
              items.length,
          ),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: ReviewRow[] }) => {
      selected.value = records;
    },
    checkboxChange: ({ records }: { records: ReviewRow[] }) => {
      selected.value = records;
    },
  },
  gridOptions,
});

function clearSelection() {
  selected.value = [];
  gridApi.grid?.clearCheckboxRow();
}

async function switchMode(next: ReviewMode) {
  mode.value = next;
  clearSelection();
  gridApi.setGridOptions({
    checkboxConfig: {
      checkMethod: ({ row }: { row: ReviewRow }) => pending(row),
    },
    columns: next === 'system' ? systemColumns : manualColumns,
  });
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

async function search() {
  if (
    filters.ApplyMin !== undefined &&
    filters.ApplyMax !== undefined &&
    filters.ApplyMin >= filters.ApplyMax
  ) {
    message.warning('最小申请金额必须小于最大申请金额');
    return;
  }
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

function reset() {
  Object.assign(filters, {
    AdminName: '',
    ApplyMax: undefined,
    ApplyMin: undefined,
    ChannelIds: [],
    ConfigId: '',
    LevelId: -1,
    LoginAccount: '',
    OrderId: '',
    PackId: '',
    RebateMode: -1,
    VipLevel: -1,
  });
  dateRange.value = [dayjs().startOf('day'), dayjs().endOf('day')];
  void search();
}

function approve(rows: ReviewRow[]) {
  actionRows.value = rows;
  if (mode.value === 'manual' && rows.length === 1) {
    approveAmount.value =
      Number(rows[0]?.ApplyBackWater ?? rows[0]?.BackWater ?? 0) / 100;
    approveVisible.value = true;
    return;
  }
  Modal.confirm({
    content: `确认通过 ${rows.length} 条返水申请？`,
    title: rows.length > 1 ? '批量通过' : '通过申请',
    onOk: () => submitApprove(),
  });
}

async function submitApprove() {
  if (
    mode.value === 'manual' &&
    actionRows.value.length === 1 &&
    (!approveAmount.value || approveAmount.value <= 0)
  ) {
    message.warning('请输入实际发放金额');
    return;
  }
  actionLoading.value = true;
  try {
    await reviewBackWaterApi({
      Approve: mode.value === 'system' ? 10 : 1,
      Ids: actionRows.value.map((item) => item.Id).join(','),
      Real:
        mode.value === 'manual' && actionRows.value.length === 1
          ? Math.round(Number(approveAmount.value) * 100)
          : 0,
    });
    message.success('审核通过');
    approveVisible.value = false;
    clearSelection();
    await gridApi.reload();
  } finally {
    actionLoading.value = false;
  }
}

function reject(rows: ReviewRow[]) {
  actionRows.value = rows;
  if (mode.value === 'system') {
    rejectDesc.value = '';
    rejectVisible.value = true;
    return;
  }
  Modal.confirm({
    content: `确认拒绝 ${rows.length} 条返水申请？`,
    title: rows.length > 1 ? '批量拒绝' : '拒绝申请',
    onOk: () => submitReject(),
  });
}

async function submitReject() {
  if (mode.value === 'system' && !rejectDesc.value.trim()) {
    message.warning('请输入审核备注');
    return;
  }
  actionLoading.value = true;
  try {
    await reviewBackWaterApi({
      Approve: mode.value === 'system' ? 11 : 2,
      Ids: actionRows.value.map((item) => item.Id).join(','),
      ReviewDesc: mode.value === 'system' ? rejectDesc.value.trim() : undefined,
    });
    message.success('已拒绝');
    rejectVisible.value = false;
    clearSelection();
    await gridApi.reload();
  } finally {
    actionLoading.value = false;
  }
}

async function submitExport() {
  if (!/^\d{6}$/.test(exportCode.value)) {
    message.warning('请输入 6 位 Google 验证码');
    return;
  }
  actionLoading.value = true;
  try {
    const {
      Page: _page,
      PageSize: _size,
      ...query
    } = queryParams({
      currentPage: 1,
      pageSize: 20,
    });
    const result = await exportBackWaterRecordApi('summary', {
      ...query,
      GoogleCode: exportCode.value,
    });
    exportVisible.value = false;
    if (result.Id && Number(result.Status) === 0) {
      message.success('导出任务已创建，请到导出管理查看');
    } else {
      message.warning(String(result.Remark || '导出任务创建失败'));
    }
  } finally {
    actionLoading.value = false;
  }
}

function openExport() {
  const rows =
    (gridApi.grid?.getTableData?.()?.fullData as ReviewRow[] | undefined) || [];
  if (rows.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  exportCode.value = '';
  exportVisible.value = true;
}

onMounted(async () => {
  const [schemeResult, levelResult] = await Promise.all([
    fetchBackWaterSchemesApi(),
    fetchPlayerLevelListApi({ Page: 1, PageSize: 999 }),
  ]);
  schemes.value = schemeResult || [];
  levels.value = levelResult.Items || [];
});
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        :value="mode"
        button-style="solid"
        @change="(event) => switchMode(event.target.value)"
      >
        <Radio.Button v-if="canSystem" value="system">系统申请</Radio.Button>
        <Radio.Button v-if="canManual" value="manual">手动申请</Radio.Button>
      </Radio.Group>
    </div>

    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <Space.Compact>
          <span class="query-field-addon">订单号</span>
          <Input
            v-model:value="filters.OrderId"
            allow-clear
            placeholder="请输入订单号"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">游戏账号</span>
          <Input
            v-model:value="filters.LoginAccount"
            allow-clear
            placeholder="请输入游戏账号"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">VIP</span>
          <Select v-model:value="filters.VipLevel" :options="vipOptions" />
        </Space.Compact>
        <Space.Compact v-if="mode === 'system'">
          <span class="query-field-addon">层级</span>
          <Select v-model:value="filters.LevelId" :options="levelOptions" />
        </Space.Compact>
        <Space.Compact v-if="mode === 'system'">
          <span class="query-field-addon">代理账号</span>
          <Input
            v-model:value="filters.AdminName"
            allow-clear
            placeholder="请输入代理账号"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">产品</span>
          <Select
            v-model:value="filters.PackId"
            :options="packageOptionsList"
            placeholder="请选择产品"
            show-search
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">渠道号</span>
          <ChannelSelect
            v-model="filters.ChannelIds"
            placeholder="请输入渠道号"
          />
        </Space.Compact>
        <Space.Compact v-if="mode === 'system'">
          <span class="query-field-addon">方案</span>
          <Select v-model:value="filters.ConfigId" :options="schemeOptions" />
        </Space.Compact>
        <Space.Compact v-if="mode === 'system'">
          <span class="query-field-addon">周期</span>
          <Select
            v-model:value="filters.RebateMode"
            :options="[
              { label: '全部周期', value: -1 },
              { label: '日结', value: 0 },
              { label: '按天', value: 1 },
              { label: '周结', value: 2 },
            ]"
          />
        </Space.Compact>
        <Space.Compact v-if="mode === 'manual'">
          <span class="query-field-addon">最小申请金额</span>
          <InputNumber
            v-model:value="filters.ApplyMin"
            :min="0"
            class="!w-full"
            placeholder="请输入最小申请金额"
          />
        </Space.Compact>
        <Space.Compact v-if="mode === 'manual'">
          <span class="query-field-addon">最大申请金额</span>
          <InputNumber
            v-model:value="filters.ApplyMax"
            :min="0"
            class="!w-full"
            placeholder="请输入最大申请金额"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" label="返水生成时间" />
        </div>
        <div
          class="query-filter-actions"
          :class="{
            'query-filter-actions-single': !(
              mode === 'system' && canSystemExport
            ),
          }"
        >
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
          <Button
            v-if="mode === 'system' && canSystemExport"
            @click="openExport"
          >
            导出 Excel
          </Button>
        </div>
      </div>
    </div>

    <div
      v-if="canBatchApprove || canBatchReject"
      class="mb-2 flex flex-wrap items-center justify-end gap-2"
    >
      <Button
        v-if="canBatchApprove"
        :disabled="selected.length === 0"
        type="primary"
        @click="approve(selected)"
      >
        批量通过
      </Button>
      <Button
        v-if="canBatchReject"
        :disabled="selected.length === 0"
        danger
        @click="reject(selected)"
      >
        批量拒绝
      </Button>
    </div>

      <Grid>
        <template #adminName="{ row }">
          <AgencyAccountLink
            :admin-id="resolveAgencyAdminId(row)"
            :username="row.AdminName"
          />
        </template>
        <template #loginAccount="{ row }">
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
        </template>
        <template #action="{ row }">
          <Space v-if="pending(row)" :size="0">
            <Button
              v-if="mode === 'system' ? canSystemApprove : canManualApprove"
              type="link"
              @click="approve([row])"
            >
              通过
            </Button>
            <Button
              v-if="mode === 'system' ? canSystemReject : canManualReject"
              danger
              type="link"
              @click="reject([row])"
            >
              拒绝
            </Button>
          </Space>
          <Tag v-else :color="reviewState(row) === '已通过' ? 'green' : 'red'">
            {{ reviewState(row) }}
          </Tag>
        </template>
      </Grid>

    <Modal
      v-model:open="approveVisible"
      :confirm-loading="actionLoading"
      title="通过审核"
      @ok="submitApprove"
    >
      <Form layout="vertical" class="pt-3">
        <Form.Item label="申请人">
          <Input :value="String(actionRows[0]?.PlayerId || '-')" disabled />
        </Form.Item>
        <Form.Item label="申请金额">
          <Input
            :value="
              formatAmountFromCent(
                actionRows[0]?.ApplyBackWater || actionRows[0]?.BackWater,
              )
            "
            disabled
          />
        </Form.Item>
        <Form.Item label="修改金额" required>
          <InputNumber
            v-model:value="approveAmount"
            :min="0"
            :precision="2"
            class="!w-full"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="rejectVisible"
      :confirm-loading="actionLoading"
      title="拒绝审核"
      @ok="submitReject"
    >
      <Form layout="vertical" class="pt-3">
        <Form.Item label="玩家账号">
          <Input
            :value="actionRows.map((item) => item.LoginAccount).join(', ')"
            disabled
          />
        </Form.Item>
        <Form.Item label="审核备注" required>
          <Input.TextArea v-model:value="rejectDesc" :rows="4" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="exportVisible"
      :confirm-loading="actionLoading"
      title="后台导出验证"
      @ok="submitExport"
    >
      <Form layout="vertical" class="pt-3">
        <Form.Item label="Google 验证码" required>
          <Input
            v-model:value="exportCode"
            :maxlength="6"
            placeholder="请输入 6 位验证码"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

